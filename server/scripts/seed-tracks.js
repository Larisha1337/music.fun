import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import https from 'https'
import Track from '../models/Track.js'

const JAMENDO_CLIENT_ID = "79ba8ce8"
const SEED_USER_ID = "6ab06b70f4d69ec4ddf8b73d"
const TRACKS_COUNT = 20 // сколько треков затащить за один запуск

const uploadDir = 'uploads/tracks'
const coverDir = 'uploads/track-covers'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true })

const downloadFile = (url, filePath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
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
    if (!JAMENDO_CLIENT_ID || !SEED_USER_ID) {
        console.error('Нужны JAMENDO_CLIENT_ID и SEED_USER_ID в .env')
        process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB подключена')

    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${TRACKS_COUNT}&audiodownload_allowed=true`

    const response = await fetch(url)
    const data = await response.json()
    const tracks = data.results

    console.log(`Найдено ${tracks.length} треков от Jamendo`)

    for (const t of tracks) {
        try {
            const audioFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`
            const audioPath = path.join(uploadDir, audioFileName)
            await downloadFile(t.audiodownload, audioPath)

            let coverUrl = null
            if (t.image) {
                const coverFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`
                const coverPath = path.join(coverDir, coverFileName)
                await downloadFile(t.image, coverPath)
                coverUrl = `/uploads/track-covers/${coverFileName}`
            }

            await Track.create({
                userId: SEED_USER_ID,
                title: `${t.name} — ${t.artist_name}`,
                fileUrl: `/uploads/tracks/${audioFileName}`,
                coverUrl,
                fileSize: fs.statSync(audioPath).size
            })

            console.log(`✓ Загружен: ${t.name} — ${t.artist_name}`)
        } catch (error) {
            console.error(`✗ Не удалось загрузить "${t.name}":`, error.message)
        }
    }

    console.log('Готово!')
    process.exit(0)
}

run()