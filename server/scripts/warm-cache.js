import 'dotenv/config'
import mongoose from 'mongoose'
import Track from '../models/Track.js'
import { initAudioCache } from '../service/audio-cache.js'
import { processTrack, analyzeStoredTrack } from '../service/track-pipeline.js'

const PAUSE_MS = 1500 // пауза между скачиваниями, чтобы YouTube не ругался
const reanalyzeAll = process.argv.includes('--all') // node scripts/warm-cache.js --all

await mongoose.connect(process.env.MONGO_URI)
await initAudioCache()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* 1. YouTube-треки без файла: скачать → R2 → анализ */
const missing = await Track.find({ fileUrl: { $in: ['', null] } })
console.log(`Треков без файла: ${missing.length}`)

let ok = 0
let failed = 0

for (const [i, track] of missing.entries()) {
    const label = `${track.artist} - ${track.title}`
    const prefix = `[${i + 1}/${missing.length}]`

    try {
        const { downloaded, analyzed } = await processTrack(track)
        console.log(`${prefix} ${downloaded ? '⬇ скачан' : '✓ из кэша'} → R2${analyzed ? ' + анализ' : ' (анализ не удался)'}: ${label}`)
        ok++
        if (downloaded) await sleep(PAUSE_MS)
    } catch (error) {
        failed++
        console.error(`${prefix} ✗ ${label}: ${error.message}`)
    }
}

/* 2. Треки с файлом, но без BPM, тональности или волны */
const filter = reanalyzeAll
    ? { fileUrl: { $nin: ['', null] } }
    : { fileUrl: { $nin: ['', null] }, $or: [{ bpm: null }, { peaks: { $exists: false } }] }

const unanalyzed = await Track.find(filter)
console.log(`\nТреков для анализа: ${unanalyzed.length}`)

let analyzedOk = 0

for (const [i, track] of unanalyzed.entries()) {
    const label = `${track.artist} - ${track.title}`
    const prefix = `[${i + 1}/${unanalyzed.length}]`

    const done = await analyzeStoredTrack(track)
    console.log(`${prefix} ${done ? '✓' : '✗'} ${label}`)
    if (done) analyzedOk++
}

console.log(`\nГотово. Скачано: ${ok}, ошибок: ${failed}, проанализировано: ${analyzedOk}`)
process.exit(0)