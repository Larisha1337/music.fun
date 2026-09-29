import 'dotenv/config'
import mongoose from 'mongoose'
import Track from '../models/Track.js'
import { findAndStreamTrack } from '../service/music-finder.js'

// Системный ID для публичных треков из чартов
const SEED_USER_ID = "6ab06b70f4d69ec4ddf8b73d"

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('📦 MongoDB подключена для массового сидинга чартов')

        // Получаем топ-50 треков из открытых чартов Deezer
        const response = await fetch('https://api.deezer.com/chart/0/tracks?limit=50')
        const data = await response.json()
        const tracks = data.data

        console.log(`🎵 Найдено ${tracks.length} треков в чартах Deezer. Начинаем связку с YouTube...`)

        for (const t of tracks) {
            try {
                const title = t.title
                const artist = t.artist.name

                // Проверяем, нет ли уже такого трека в базе, чтобы не дублировать
                const existing = await Track.findOne({ title, artist })
                if (existing) {
                    console.log(`— Пропущен (уже есть): ${artist} - ${title}`)
                    continue
                }

                console.log(`⏳ Обработка: ${artist} - ${title}`)

                // Получаем обложку из Deezer и стрим с YouTube
                const trackInfo = await findAndStreamTrack(title, artist)

                // Сохраняем в MongoDB
                await Track.create({
                    userId: SEED_USER_ID,
                    title: trackInfo.title,
                    artist: trackInfo.artist,
                    fileUrl: trackInfo.fileUrl,     // Прямая ссылка на стрим YouTube
                    coverUrl: trackInfo.coverUrl,   // Обложка из Deezer
                    isSeed: true,
                    isStreamed: true                // Флаг стрима
                })

                console.log(`✓ Успешно добавлен: ${trackInfo.artist} - ${trackInfo.title}`)

                // 💡 Обязательная пауза в 2 секунды между запросами,
                // чтобы YouTube не вредничал и не банил IP за частый поиск
                await new Promise(resolve => setTimeout(resolve, 2000))

            } catch (error) {
                console.error(`✗ Ошибка для трека "${t.title}":`, error.message)
            }
        }

        console.log('🎉 Массовая загрузка чартов успешно завершена!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Ошибка сидинга:', error)
        process.exit(1)
    }
}

run()