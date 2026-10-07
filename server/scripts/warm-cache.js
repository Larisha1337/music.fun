import 'dotenv/config'
import mongoose from 'mongoose'
import Track from '../models/Track.js'
import { initAudioCache, ensureCached, publishToR2 } from '../service/audio-cache.js'

const PAUSE_MS = 1500 // пауза между скачиваниями, чтобы YouTube не ругался

await mongoose.connect(process.env.MONGO_URI)
await initAudioCache()

// YouTube-треки: у них ещё нет своего файла в R2
const tracks = await Track.find({ fileUrl: { $in: ['', null] } })
console.log(`Треков для прогрева: ${tracks.length}`)

let ok = 0
let failed = 0

for (const [i, track] of tracks.entries()) {
    const label = `${track.artist} - ${track.title}`
    const prefix = `[${i + 1}/${tracks.length}]`

    try {
        const { file, fromCache } = await ensureCached(track)
        await publishToR2(track, file)

        console.log(`${prefix} ${fromCache ? '✓ из кэша' : '⬇ скачан'} → R2: ${label}`)
        ok++

        if (!fromCache) await new Promise((r) => setTimeout(r, PAUSE_MS))
    } catch (error) {
        failed++
        console.error(`${prefix} ✗ ${label}: ${error.message}`)
    }
}

console.log(`Готово. Успешно: ${ok}, с ошибками: ${failed}`)
process.exit(0)