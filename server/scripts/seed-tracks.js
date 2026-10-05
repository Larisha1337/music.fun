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

    // 🎸 Добавленные крутые треки:
    { title: "Californication", artist: "Red Hot Chili Peppers" },
    { title: "Master of Puppets", artist: "Metallica" },
    { title: "Enter Sandman", artist: "Metallica" },
    { title: "Seven Nation Army", artist: "The White Stripes" },
    { title: "Boulevard of Broken Dreams", artist: "Green Day" },
    { title: "Starboy", artist: "The Weeknd" },
    { title: "Save Your Tears", artist: "The Weeknd" },
    { title: "Lose Yourself", artist: "Eminem" },
    { title: "The Real Slim Shady", artist: "Eminem" },
    { title: "In the Air Tonight", artist: "Phil Collins" },
    { title: "Animals", artist: "Martin Garrix" },
    { title: "Wake Me Up", artist: "Avicii" },
    { title: "Levels", artist: "Avicii" },
    { title: "Smooth Criminal", artist: "Michael Jackson" }
]

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB подключена')

        console.log(`Всего в списке на добавление: ${searchQueries.length} треков`)

        for (const item of searchQueries) {
            try {
                const { title, artist } = item

                const trackInfo = await findAndStreamTrack(title, artist)

                const existing = await Track.findOne({ title: trackInfo.title, artist: trackInfo.artist })
                if (existing) {
                    console.log(`— Пропущен (уже есть): ${trackInfo.artist} - ${trackInfo.title}`)
                    continue
                }
                await Track.create({
                    userId: SEED_USER_ID,
                    title: trackInfo.title,
                    artist: trackInfo.artist,
                    fileUrl: '',                    // аудио стримится через бэкенд
                    coverUrl: trackInfo.coverUrl,
                    isSeed: true,
                    isStreamed: true
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