import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import compression from 'compression'
import multer from 'multer'
import userRoutes from './routes/user.js'
import trackRoutes from './routes/track.js'
import authRoutes from './routes/auth.js'
import playlistRoutes from './routes/playlist.js'
import { initAudioCache } from './service/audio-cache.js'

if (!process.env.JWT_SECRET) {
    console.error('Не задан JWT_SECRET в .env')
    process.exit(1)
}

const app = express()

// За прокси (Render, Railway, Nginx) без этого ограничитель попыток видит один и тот же IP у всех
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY))
}

app.use(cors({
    // Несколько адресов через запятую: CLIENT_ORIGIN=https://my.app,http://localhost:5173
    origin: process.env.CLIENT_ORIGIN
        ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
        : 'http://localhost:5173',
    credentials: true,
    // Разрешаем браузеру видеть заголовки диапазонов (перемотка)
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}))

// Сжимаем JSON; аудио уже сжато, его пропускаем
app.use(compression({
    filter: (req, res) => (req.path.endsWith('/stream') ? false : compression.filter(req, res)),
}))

app.use(express.json({ limit: '100kb' }))

// Нужно только пока в базе остались обложки плейлистов со старыми путями /uploads/...
// После запуска scripts/migrate-playlist-covers.js эту строку можно удалить
app.use('/uploads', express.static('uploads'))

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB подключена'))
    .catch((err) => console.error('Ошибка подключения к MongoDB:', err))

initAudioCache().catch((err) => console.error('[AudioCache] Ошибка инициализации:', err))

app.use('/api/user', userRoutes)
app.use('/api/tracks', trackRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/playlists', playlistRoutes)

// Единый обработчик ошибок: ошибки загрузки файлов и битый JSON становятся 400, а не 500
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)

    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'Файл слишком большой' : 'Ошибка загрузки файла'
        return res.status(400).json({ message })
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Некорректный запрос' })
    }

    if (err.status && err.status < 500) {
        return res.status(err.status).json({ message: err.message })
    }

    console.error('[Unhandled error]:', err)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))