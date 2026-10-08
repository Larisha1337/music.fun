import 'dotenv/config'
import mongoose from 'mongoose'
import fsp from 'fs/promises'
import path from 'path'
import Playlist from '../models/Playlist.js'
import { uploadToR2 } from '../service/r2.js'

const MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
}

await mongoose.connect(process.env.MONGO_URI)

const playlists = await Playlist.find({ coverUrl: /^\/uploads\// })
console.log(`Плейлистов со старыми обложками: ${playlists.length}`)

let moved = 0
let lost = 0

for (const playlist of playlists) {
    // basename защищает от путей вида ../../секрет
    const name = path.basename(playlist.coverUrl)
    const file = path.join(process.cwd(), 'uploads', name)
    const ext = path.extname(name).toLowerCase()

    try {
        const buffer = await fsp.readFile(file)

        const url = await uploadToR2(
            { originalname: name, buffer, mimetype: MIME[ext] || 'application/octet-stream' },
            'playlist-covers'
        )

        playlist.coverUrl = url
        await playlist.save()
        moved++
        console.log(`✓ ${playlist.name} → R2`)
    } catch (error) {
        // Файла нет (например, пропал при деплое): ссылка всё равно была бы битой
        playlist.coverUrl = null
        await playlist.save()
        lost++
        console.warn(`✗ ${playlist.name}: файл не найден, обложка сброшена (${error.code || error.message})`)
    }
}

console.log(`Готово. Перенесено: ${moved}, потеряно: ${lost}`)
console.log('Локальные файлы я не удалял: после проверки можно убрать папку uploads/ вручную.')
process.exit(0)