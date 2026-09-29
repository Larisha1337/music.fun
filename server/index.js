import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import 'dotenv/config'
import userRoutes from './routes/user.js'
import trackRoutes from './routes/track.js'
import authRoutes from './routes/auth.js'
import playlistRoutes from './routes/playlist.js'


const app = express()

app.use(cors({
    origin: 'http://localhost:5173', // Укажи точный URL твоего фронтенда (или true, если хочешь разрешить любые)
    credentials: true,
    // 🌟 САМОЕ ГЛАВНОЕ ДЛЯ ПЕРЕМОТКИ: разрешаем браузеру видеть заголовки диапазонов
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));
app.use(express.json())
app.use('/uploads', express.static('uploads')) // отдаём загруженные файлы наружу

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB подключена'))
    .catch((err) => console.error('Ошибка подключения к MongoDB:', err))

app.use('/api/user', userRoutes)
app.use('/api/tracks', trackRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/playlists', playlistRoutes);

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))