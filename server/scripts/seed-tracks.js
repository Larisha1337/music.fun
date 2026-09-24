import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import https from 'https'
import Track from '../models/Track.js'

// 💡 Используем системный ID или null, чтобы треки не были привязаны к реальному юзеру
const SEED_USER_ID = "6ab06b70f4d69ec4ddf8b73d" || "system"
const uploadDir = 'uploads/tracks'
const coverDir = 'uploads/track-covers'

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true })

const downloadFile = (url, filePath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, filePath).then(resolve).catch(reject)
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Статус ${response.statusCode} для ${url}`))
                return
            }
            const fileStream = fs.createWriteStream(filePath)
            response.pipe(fileStream)
            fileStream.on('finish', () => {
                fileStream.close()
                resolve()
            })
        }).on('error', reject)
    })
}

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB подключена')

    const response = await fetch('https://api.deezer.com/chart/0/tracks?limit=30')
    const data = await response.json()
    const tracks = data.data

    console.log(`Найдено ${tracks.length} треков из чартов Deezer`)

    for (const t of tracks) {
        try {
            if (!t.preview) continue

            const audioFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`
            const audioPath = path.join(uploadDir, audioFileName)

            await downloadFile(t.preview, audioPath)

            let coverUrl = null
            const imageUrl = t.album?.cover_medium || t.artist?.picture_medium
            if (imageUrl) {
                const coverFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`
                const coverPath = path.join(coverDir, coverFileName)
                await downloadFile(imageUrl, coverPath)
                coverUrl = `/uploads/track-covers/${coverFileName}`
            }

            // 👇 ВОТ ЗДЕСЬ ДОБАВЛЕН ФЛАГ isSeed: true
            await Track.create({
                userId: SEED_USER_ID,
                title: t.title,
                artist: t.artist.name,
                fileUrl: `/uploads/tracks/${audioFileName}`,
                coverUrl,
                fileSize: fs.statSync(audioPath).size,
                isSeed: true
            })

            console.log(`✓ Загружен: ${t.title} — ${t.artist.name}`)
        } catch (error) {
            console.error(`✗ Ошибка загрузки "${t.title}":`, error.message)
        }
    }

    console.log('Готово!')
    process.exit(0)
}

run()