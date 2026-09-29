import 'dotenv/config'
import mongoose from 'mongoose'
import Track from '../models/Track.js'
import { findAndStreamTrack } from '../service/music-finder.js'

const SEED_USER_ID = "6ab06b70f4d69ec4ddf8b73d"

// 👇 СЮДА ВПИСЫВАЙ ТРЕКИ, КОТОРЫЕ ХОЧЕШЬ ДОБАВИТЬ В БАЗУ
const searchQueries = [
    { title: "Blinding Lights", artist: "The Weeknd" },
    { title: "Numb", artist: "Linkin Park" },
    { title: "Bad Guy", artist: "Billie Eilish" },
    { title: "In the End", artist: "Linkin Park" },
    { title: "Believer", artist: "Imagine Dragons" },
    { title: "You Give Love A Bad Name", artist: "Bon Jovi" },
    { title: "Smells Like Teen Spirit", artist: "Nirvana" },
    // Можешь добавлять сюда сколько угодно своих треков в формате:
    // { title: "Название", artist: "Исполнитель" },
]

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB подключена')

        console.log(`Всего в списке на добавление: ${searchQueries.length} треков`)

        for (const item of searchQueries) {
            try {
                const { title, artist } = item

                // Проверяем, нет ли уже такого трека в базе, чтобы избежать дубликатов
                const existing = await Track.findOne({ title, artist })
                if (existing) {
                    console.log(`— Пропущен (уже есть): ${artist} - ${title}`)
                    continue
                }

                console.log(`⏳ Обработка: ${artist} - ${title}`)

                // Получаем обложку из Deezer и аудиопоток с YouTube
                const trackInfo = await findAndStreamTrack(title, artist)

                await Track.create({
                    userId: SEED_USER_ID,
                    title: trackInfo.title,
                    artist: trackInfo.artist,
                    fileUrl: trackInfo.fileUrl,     // Ссылка на полный стрим YouTube
                    coverUrl: trackInfo.coverUrl,   // Обложка из Deezer
                    isSeed: true,
                    isStreamed: true                // Флаг стрима
                })

                console.log(`✓ Успешно добавлен: ${trackInfo.artist} - ${trackInfo.title}`)

                // Пауза 2 секунды между запросами, чтобы YouTube не банил IP
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
                console.error(`✗ Ошибка для "${item.title} - ${item.artist}":`, error.message)
            }
        }

        console.log('Готово! Все треки из твоего списка добавлены.')
        process.exit(0)
    } catch (error) {
        console.error('Ошибка сидинга:', error)
        process.exit(1)
    }
}

run()