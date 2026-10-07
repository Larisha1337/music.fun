import fsp from 'fs/promises'
import path from 'path'
import youtubedl from 'yt-dlp-exec'
import Track from '../models/Track.js'
import { uploadToR2 } from './r2.js'

const CACHE_DIR = path.resolve(process.env.AUDIO_CACHE_DIR || 'cache/audio')
const MAX_CACHE_BYTES = (Number(process.env.AUDIO_CACHE_MAX_MB) || 2048) * 1024 * 1024
const MAX_PARALLEL = 3 // сколько загрузок с YouTube одновременно

const AUDIO_EXT = new Set(['.m4a', '.mp4', '.webm', '.opus', '.ogg', '.mp3', '.aac'])
const MIME = {
    '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4',
    '.aac': 'audio/aac',
    '.webm': 'audio/webm',
    '.opus': 'audio/ogg',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
}

export const mimeForFile = (file) =>
    MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'

const VIDEO_ID = /^[\w-]{11}$/

const lastUsed = new Map()  // videoId -> время последнего обращения (для очистки кэша)
const downloads = new Map() // videoId -> Promise: чтобы один ролик не качался дважды
const searches = new Map()  // trackId -> Promise: чтобы не искать один трек дважды

/* ---------- Ограничитель параллельных загрузок ---------- */

let active = 0
const waiters = []

const acquire = () =>
    new Promise((resolve) => {
        if (active < MAX_PARALLEL) {
            active++
            resolve()
        } else {
            waiters.push(resolve)
        }
    })

const release = () => {
    const next = waiters.shift()
    if (next) next()
    else active--
}

/* ---------- Файлы кэша ---------- */

export const findCachedFile = async (videoId) => {
    const names = await fsp.readdir(CACHE_DIR).catch(() => [])
    const name = names.find(
        (n) => n.startsWith(`${videoId}.`) && AUDIO_EXT.has(path.extname(n).toLowerCase())
    )
    return name ? path.join(CACHE_DIR, name) : null
}

/** Удаляет самые давно не игравшие файлы, когда кэш вырос больше лимита */
export const pruneCache = async () => {
    const names = await fsp.readdir(CACHE_DIR).catch(() => [])
    const files = []
    const now = Date.now()
    let total = 0

    for (const name of names) {
        const full = path.join(CACHE_DIR, name)
        const stat = await fsp.stat(full).catch(() => null)
        if (!stat?.isFile()) continue

        if (!AUDIO_EXT.has(path.extname(name).toLowerCase())) {
            // хвосты оборванных загрузок (.part и т.п.) старше часа
            if (now - stat.mtimeMs > 3_600_000) await fsp.unlink(full).catch(() => {})
            continue
        }

        const id = name.slice(0, name.indexOf('.'))
        files.push({ full, size: stat.size, used: lastUsed.get(id) ?? stat.mtimeMs })
        total += stat.size
    }

    if (total <= MAX_CACHE_BYTES) return

    files.sort((a, b) => a.used - b.used)
    for (const f of files) {
        if (total <= MAX_CACHE_BYTES * 0.9) break
        await fsp
            .unlink(f.full)
            .then(() => {
                total -= f.size
            })
            .catch(() => {})
    }
}

export const initAudioCache = async () => {
    await fsp.mkdir(CACHE_DIR, { recursive: true })
    await pruneCache()
    console.log(`[AudioCache] Папка кэша: ${CACHE_DIR}`)
}

/* ---------- Поиск видео и загрузка ---------- */

const searchVideoId = async (track) => {
    const query = [track.artist, track.title].filter(Boolean).join(' - ')

    // flat-playlist: берём только id из выдачи, без полной обработки страницы видео (намного быстрее)
    const result = await youtubedl.exec(`ytsearch1:${query} audio`, {
        print: 'id',
        flatPlaylist: true,
        noWarnings: true,
        socketTimeout: 10,
    })

    const id = String(result.stdout || '').trim().split('\n')[0]?.trim()
    if (!id || !VIDEO_ID.test(id)) {
        throw new Error(`yt-dlp не нашёл видео для "${query}"`)
    }
    return id
}

/** id видео: из базы, а если его там нет, ищем один раз и запоминаем */
export const resolveVideoId = async (track) => {
    if (track.youtubeId && VIDEO_ID.test(track.youtubeId)) return track.youtubeId

    const key = String(track._id)
    let job = searches.get(key)

    if (!job) {
        job = searchVideoId(track)
            .then(async (id) => {
                await Track.updateOne({ _id: track._id }, { $set: { youtubeId: id } })
                track.youtubeId = id
                return id
            })
            .finally(() => searches.delete(key))
        searches.set(key, job)
    }

    return job
}

const downloadAudio = async (videoId) => {
    // m4a (AAC) играется везде, включая Safari; если его нет, берём лучший доступный
    await youtubedl.exec(`https://www.youtube.com/watch?v=${videoId}`, {
        format: 'bestaudio[ext=m4a]/bestaudio',
        output: path.join(CACHE_DIR, `${videoId}.%(ext)s`),
        noPlaylist: true,
        noWarnings: true,
        noCheckCertificates: true,
        socketTimeout: 15,
        retries: 3,
    })
}

/**
 * Гарантирует, что аудио трека лежит в кэше.
 * Возвращает { file, videoId, fromCache }.
 */
export const ensureCached = async (track) => {
    const videoId = await resolveVideoId(track)

    const cached = await findCachedFile(videoId)
    if (cached) {
        lastUsed.set(videoId, Date.now())
        return { file: cached, videoId, fromCache: true }
    }

    let job = downloads.get(videoId)

    if (!job) {
        job = (async () => {
            await acquire()
            try {
                console.log(`[AudioCache] Скачиваю ${videoId} (${track.artist} - ${track.title})`)
                await downloadAudio(videoId)

                const file = await findCachedFile(videoId)
                if (!file) throw new Error('Файл не появился после загрузки')

                pruneCache().catch((e) => console.error('[AudioCache] prune error:', e.message))
                return file
            } finally {
                release()
            }
        })().finally(() => downloads.delete(videoId))

        downloads.set(videoId, job)
    }

    const file = await job
    lastUsed.set(videoId, Date.now())
    return { file, videoId, fromCache: false }
}

/** Заливает скачанный файл в R2 и записывает ссылку в трек */
export const publishToR2 = async (track, file) => {
    const url = await uploadToR2(
        {
            originalname: path.basename(file),
            buffer: await fsp.readFile(file),
            mimetype: mimeForFile(file),
        },
        'tracks'
    )

    await Track.updateOne({ _id: track._id }, { $set: { fileUrl: url, isStreamed: true } })
    track.fileUrl = url
    return url
}