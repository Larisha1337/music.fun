import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import ffmpegPath from 'ffmpeg-static'
import { ensureCached } from './audio-cache.js'

export const MIN_LEN = 1   // секунд
export const MAX_LEN = 900 // 15 минут

const MAX_PARALLEL = 2     // ffmpeg грузит процессор, больше двух задач сразу не берём
const MAX_SOURCE_BYTES = 100 * 1024 * 1024

const httpError = (status, message) => Object.assign(new Error(message), { status })

/* ---------- Ограничитель параллельных задач ---------- */

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

/* ---------- Вспомогательное ---------- */

const isOwnFile = (url) =>
    Boolean(url && process.env.R2_PUBLIC_DOMAIN && url.startsWith(process.env.R2_PUBLIC_DOMAIN))

const downloadToDir = async (url, dir) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
    if (!res.ok || !res.body) throw httpError(502, `Не удалось получить исходный файл (HTTP ${res.status})`)

    if (Number(res.headers.get('content-length') || 0) > MAX_SOURCE_BYTES) {
        throw httpError(413, 'Исходный файл слишком большой')
    }

    const ext = path.extname(new URL(url).pathname) || '.mp3'
    const file = path.join(dir, `source${ext}`)
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(file))
    return file
}

const runFfmpeg = (args) =>
    new Promise((resolve, reject) => {
        if (!ffmpegPath) return reject(httpError(500, 'ffmpeg не найден (пакет ffmpeg-static)'))

        const proc = spawn(ffmpegPath, args, { windowsHide: true })
        let stderr = ''

        const timer = setTimeout(() => proc.kill('SIGKILL'), 120_000)

        proc.stderr.on('data', (chunk) => {
            stderr = (stderr + chunk).slice(-2000)
        })
        proc.on('error', (e) => {
            clearTimeout(timer)
            reject(e)
        })
        proc.on('close', (code) => {
            clearTimeout(timer)
            if (code === 0) resolve()
            else reject(httpError(422, `ffmpeg не смог обработать файл: ${stderr.trim().split('\n').slice(-2).join(' | ') || `код ${code}`}`))
        })
    })

/**
 * Вырезает отрезок [start, end] секунд и возвращает mp3 в памяти.
 * Источник: свой файл из R2 или (если файла ещё нет) кэш YouTube.
 */
export const trimTrack = async (track, start, end) => {
    await acquire()
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'trim-'))

    try {
        const source = isOwnFile(track.fileUrl)
            ? await downloadToDir(track.fileUrl, dir)
            : (await ensureCached(track)).file

        const out = path.join(dir, 'out.mp3')
        const len = end - start

        // Короткие затухания на краях, чтобы не было щелчков
        const fade = len > 1
            ? `afade=t=in:st=0:d=0.03,afade=t=out:st=${(len - 0.08).toFixed(2)}:d=0.08`
            : null

        await runFfmpeg([
            '-y', '-v', 'error',
            '-ss', start.toFixed(2),
            '-i', source,
            '-t', len.toFixed(2),
            '-vn', '-map_metadata', '-1',
            ...(fade ? ['-af', fade] : []),
            '-c:a', 'libmp3lame', '-q:a', '2',
            out,
        ])

        const stat = await fsp.stat(out)
        if (stat.size < 2048) throw httpError(422, 'Отрезок выходит за пределы трека')

        return { buffer: await fsp.readFile(out), size: stat.size }
    } finally {
        release()
        // Удаляем только временную папку: файл из кэша YouTube остаётся
        await fsp.rm(dir, { recursive: true, force: true }).catch(() => {})
    }
}

/* ---------- Сборка трека из нескольких отрезков ---------- */

export const MAX_SEGMENTS = 20
export const MAX_TOTAL = 1800 // 30 минут суммарно
export const MAX_SOURCES = 8  // разных исходных треков

/**
 * segments: [{ track, start, end }] в нужном порядке.
 * crossfade: 0 (жёсткая склейка) или секунды плавного перехода.
 */
export const composeTracks = async (segments, crossfade = 0) => {
    await acquire()
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'compose-'))

    try {
        // Каждый исходный трек скачиваем один раз
        const files = new Map()
        let n = 0
        for (const { track } of segments) {
            const key = String(track._id)
            if (files.has(key)) continue

            const sub = path.join(dir, `src${n++}`)
            await fsp.mkdir(sub)
            files.set(
                key,
                isOwnFile(track.fileUrl)
                    ? await downloadToDir(track.fileUrl, sub)
                    : (await ensureCached(track)).file
            )
        }

        const lens = segments.map((s) => s.end - s.start)
        const count = segments.length

        // Переход не может быть длиннее половины самого короткого отрезка
        const fade = crossfade > 0 ? Math.max(0.1, Math.min(crossfade, Math.min(...lens) / 2 - 0.05)) : 0

        // Микро-затухания на краях убирают щелчки (при плавных переходах нужны только у первого и последнего)
        const edge = (i) => {
            const parts = []
            if (fade === 0 || i === 0) parts.push('afade=t=in:st=0:d=0.03')
            if (fade === 0 || i === count - 1) {
                parts.push(`afade=t=out:st=${Math.max(0, lens[i] - 0.08).toFixed(2)}:d=0.08`)
            }
            return parts.length ? `,${parts.join(',')}` : ''
        }

        // Приводим все отрезки к одному формату (у источников разная частота и число каналов)
        const prep = segments.map(
            (_, i) =>
                `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,asetpts=PTS-STARTPTS${edge(i)}[a${i}]`
        )

        let graph
        if (fade === 0) {
            const labels = segments.map((_, i) => `[a${i}]`).join('')
            graph = [...prep, `${labels}concat=n=${count}:v=0:a=1[out]`].join(';')
        } else {
            const chain = []
            let prev = '[a0]'
            for (let i = 1; i < count; i++) {
                const out = i === count - 1 ? '[out]' : `[x${i}]`
                chain.push(`${prev}[a${i}]acrossfade=d=${fade.toFixed(2)}:c1=tri:c2=tri${out}`)
                prev = out
            }
            graph = [...prep, ...chain].join(';')
        }

        const out = path.join(dir, 'out.mp3')
        const args = ['-y', '-v', 'error']
        for (const { track, start, end } of segments) {
            args.push('-ss', start.toFixed(2), '-t', (end - start).toFixed(2), '-i', files.get(String(track._id)))
        }
        args.push('-filter_complex', graph, '-map', '[out]', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-q:a', '2', out)

        await runFfmpeg(args)

        const stat = await fsp.stat(out)
        if (stat.size < 2048) throw httpError(422, 'Отрезки выходят за пределы треков')

        const duration = lens.reduce((a, b) => a + b, 0) - fade * (count - 1)
        return { buffer: await fsp.readFile(out), size: stat.size, duration }
    } finally {
        release()
        await fsp.rm(dir, { recursive: true, force: true }).catch(() => {})
    }
}