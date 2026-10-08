import 'dotenv/config'
import mongoose from 'mongoose'
import axios from 'axios'
import Track from '../models/Track.js'
import { initAudioCache } from '../service/audio-cache.js'
import { processTrack } from '../service/track-pipeline.js'

const args = process.argv.slice(2)
const forcePipeline = args.includes('--run')
const query = args.filter((a) => !a.startsWith('--')).join(' ').trim()

const ANALYZER_URL = process.env.ANALYZER_URL || 'http://127.0.0.1:8000'

const ok = (m) => console.log(`✅ ${m}`)
const bad = (m) => console.log(`❌ ${m}`)
const info = (m) => console.log(`   ${m}`)

if (!query) {
    console.log('Использование: node scripts/debug-analyze.js "часть названия" [--run]')
    console.log('  --run  заново прогнать весь цикл (скачать, залить в R2, проанализировать)')
    process.exit(1)
}

/* 1. База данных */
try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
    ok('MongoDB подключена')
} catch (e) {
    bad(`MongoDB недоступна: ${e.message.split('\n')[0]}`)
    info('Проверь список IP в Atlas (Network Access) и что кластер не на паузе')
    process.exit(1)
}

/* 2. Python-сервис */
let pythonUp = false
try {
    await axios.get(`${ANALYZER_URL}/openapi.json`, { timeout: 5000 })
    pythonUp = true
    ok(`Python-сервис отвечает (${ANALYZER_URL})`)
} catch (e) {
    bad(`Python-сервис не отвечает на ${ANALYZER_URL}: ${e.message}`)
    info('Запусти python-service/main.py и дождись строки "Uvicorn running"')
}

/* 3. Трек */
const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
let track = await Track.findOne({ $or: [{ title: rx }, { artist: rx }] }).select('+peaks')

if (!track) {
    bad(`Трек по запросу "${query}" не найден в базе`)
    process.exit(1)
}

const printTrack = (t) => {
    ok(`Трек: ${t.artist} - ${t.title}`)
    info(`fileUrl: ${t.fileUrl || '(пусто)'}`)
    info(`BPM: ${t.bpm ?? '—'} | тональность: ${t.musicalKey ?? '—'} | волна: ${t.peaks?.length ?? 0} точек | анализ: ${t.analyzedAt ?? '—'}`)
}

printTrack(track)

/* 4. Файл в R2: пайплайн анализирует только то, что лежит в нашем хранилище */
if (!track.fileUrl || forcePipeline) {
    console.log(track.fileUrl ? '\n▶ Запускаю полный цикл (--run)...' : '\n▶ У трека нет файла, запускаю скачивание и анализ...')
    await initAudioCache()
    try {
        const result = await processTrack(track)
        info(`Результат цикла: ${JSON.stringify(result)}`)
    } catch (e) {
        bad(`Цикл упал: ${e.message}`)
    }
    track = await Track.findById(track._id).select('+peaks')
    console.log()
    printTrack(track)
}

if (!track.fileUrl) {
    bad('Файл так и не появился в R2, анализировать нечего')
    info('Смотри ошибки выше (yt-dlp, YouTube, ключи R2)')
    process.exit(1)
}

const domain = process.env.R2_PUBLIC_DOMAIN
if (!domain || !track.fileUrl.startsWith(domain)) {
    bad(`fileUrl не начинается с R2_PUBLIC_DOMAIN (${domain || 'не задан'})`)
    info('Пайплайн пропускает такие треки: анализ запускается только для файлов из нашего R2')
}

/* 5. Доступен ли файл по ссылке (так же его будет качать Python) */
try {
    const r = await axios.get(track.fileUrl, {
        headers: { Range: 'bytes=0-1023' },
        responseType: 'arraybuffer',
        validateStatus: () => true,
        timeout: 15000,
    })
    if (r.status === 200 || r.status === 206) ok(`Файл доступен по ссылке (HTTP ${r.status})`)
    else {
        bad(`Файл недоступен: HTTP ${r.status}`)
        info('В Cloudflare R2 у бакета должен быть включён публичный доступ (Public Development URL или свой домен)')
    }
} catch (e) {
    bad(`Не удалось открыть ссылку на файл: ${e.message}`)
}

/* 6. Сам анализ */
if (!pythonUp) process.exit(1)

console.log('\n▶ Отправляю файл в Python-сервис...')
try {
    const { data } = await axios.post(`${ANALYZER_URL}/analyze`, { url: track.fileUrl }, { timeout: 180000 })
    ok(`Анализ прошёл: ${data.bpm} BPM, ${data.key}, волна ${data.peaks?.length ?? 0} точек`)

    await Track.updateOne(
        { _id: track._id },
        { $set: { bpm: data.bpm, musicalKey: data.key, peaks: data.peaks, analyzedAt: new Date() } }
    )
    ok('Результат записан в базу. Обнови страницу в браузере')
} catch (e) {
    const detail = e.response?.data?.detail ?? e.response?.data ?? e.message
    bad(`Python вернул ошибку: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
}

process.exit(0)