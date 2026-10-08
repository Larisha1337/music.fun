import Track from '../models/Track.js'
import { ensureCached, publishToR2 } from './audio-cache.js'
import { analyzeAudioUrl } from './analyzer.js'

const isOwnFile = (url) =>
    Boolean(url && process.env.R2_PUBLIC_DOMAIN && url.startsWith(process.env.R2_PUBLIC_DOMAIN))

/** Анализ уже лежащего в R2 файла: BPM, тональность, волна */
export const analyzeStoredTrack = async (track) => {
    if (!isOwnFile(track.fileUrl)) return false

    const result = await analyzeAudioUrl(track.fileUrl)
    if (!result) return false

    const set = { analyzedAt: new Date() }
    if (result.bpm) set.bpm = result.bpm
    if (result.key) set.musicalKey = result.key
    if (result.peaks?.length) set.peaks = result.peaks

    await Track.updateOne({ _id: track._id }, { $set: set })
    return true
}

/** Полный цикл: YouTube → кэш → R2 → анализ (если у трека уже есть файл, только анализ) */
export const processTrack = async (trackOrId) => {
    const track = trackOrId instanceof Track ? trackOrId : await Track.findById(trackOrId)
    if (!track) return { downloaded: false, analyzed: false }

    let downloaded = false
    if (!track.fileUrl) {
        const { file, fromCache } = await ensureCached(track)
        await publishToR2(track, file)
        downloaded = !fromCache
    }

    const analyzed = await analyzeStoredTrack(track)
    return { downloaded, analyzed }
}

/* ---------- Очередь для сервера: задачи идут по одной, ответы пользователям не ждут ---------- */

const pending = new Set()
const queue = []
let running = false

const drain = async () => {
    if (running) return
    running = true

    while (queue.length) {
        const id = queue.shift()
        try {
            await processTrack(id)
        } catch (error) {
            console.error(`[Pipeline] Трек ${id}:`, error.message)
        } finally {
            pending.delete(id)
        }
    }

    running = false
}

export const enqueueTrackProcessing = (trackId) => {
    const id = String(trackId)
    if (pending.has(id)) return
    pending.add(id)
    queue.push(id)
    drain()
}