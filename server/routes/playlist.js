import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import authMiddleware from '../middleware/auth.js'
import Playlist from '../models/Playlist.js'

const router = express.Router()

// Создаем папку uploads, если её ещё нет
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads')
}

// Конфигурация Multer для загрузки обложек
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname))
    }
})

// 👈 Вот эта переменная upload, которой не хватало
const upload = multer({ storage })

// Применяем авторизацию ко всем роутам ниже
router.use(authMiddleware)

// 1. Получить МОИ плейлисты (для сайдбара)
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist.find({ ownerId: req.userId }, 'name coverUrl tracks').sort({ createdAt: -1 })
        res.status(200).json(playlists)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения плейлистов' })
    }
})

// 2. Получить конкретный плейлист (с треками)
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, ownerId: req.userId })
            .populate('tracks')

        if (!playlist) return res.status(404).json({ message: 'Плейлист не найден' })
        res.status(200).json(playlist)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

// 3. Создать плейлист (с поддержкой файла обложки)
router.post('/', upload.single('cover'), async (req, res) => {
    try {
        const body = req.body || {}
        const { name, description } = body

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Название обязательно' })
        }

        let coverUrl = body.coverUrl || null
        if (req.file) {
            coverUrl = `/uploads/${req.file.filename}`
        }

        const newPlaylist = await Playlist.create({
            name: name.trim(),
            description: description?.trim(),
            coverUrl,
            ownerId: req.userId
        })

        res.status(201).json(newPlaylist)
    } catch (error) {
        console.error('Ошибка создания плейлиста:', error)
        res.status(500).json({ message: 'Ошибка создания плейлиста' })
    }
})

// 4. Обновить плейлист (название, описание, обложка и теперь порядок треков!)
router.put('/:id', upload.single('cover'), async (req, res) => {
    try {
        const body = req.body || {}
        const { name, description, tracks } = body // 👈 принимаем tracks

        const updateData = {}
        if (name) updateData.name = name
        if (description !== undefined) updateData.description = description

        // Если передан новый массив треков (приходит из FormData как JSON-строка или массив)
        if (tracks) {
            updateData.tracks = typeof tracks === 'string' ? JSON.parse(tracks) : tracks
        }

        // Если пришел файл обложки через FormData
        if (req.file) {
            updateData.coverUrl = `/uploads/${req.file.filename}`
        } else if (body.coverUrl) {
            updateData.coverUrl = body.coverUrl
        }

        const updated = await Playlist.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.userId },
            updateData,
            { new: true }
        ).populate('tracks')

        if (!updated) return res.status(404).json({ message: 'Плейлист не найден' })
        res.status(200).json(updated)
    } catch (error) {
        console.error('Ошибка обновления:', error)
        res.status(500).json({ message: 'Ошибка обновления' })
    }
})

// 5. Удалить плейлист
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Playlist.findOneAndDelete({ _id: req.params.id, ownerId: req.userId })
        if (!deleted) return res.status(404).json({ message: 'Плейлист не найден' })

        res.status(200).json({ message: 'Удалено', id: req.params.id })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления' })
    }
})

// 6. Добавить трек в плейлист
router.post('/:id/tracks', async (req, res) => {
    try {
        const { trackId } = req.body
        if (!trackId) return res.status(400).json({ message: 'Нет ID трека' })

        const updated = await Playlist.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.userId },
            { $addToSet: { tracks: trackId } },
            { new: true }
        ).populate('tracks')

        if (!updated) return res.status(404).json({ message: 'Плейлист не найден' })
        res.status(200).json(updated)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка добавления трека' })
    }
})

// 7. Удалить трек из плейлиста
router.delete('/:id/tracks/:trackId', async (req, res) => {
    try {
        const updated = await Playlist.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.userId },
            { $pull: { tracks: req.params.trackId } },
            { new: true }
        ).populate('tracks')

        if (!updated) return res.status(404).json({ message: 'Плейлист не найден' })
        res.status(200).json(updated)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
})

// 8. Лайк / Дизлайк трека (автоматически управляет системным плейлистом "Мне нравится")
router.post('/liked/toggle', async (req, res) => {
    try {
        const { trackId } = req.body
        if (!trackId) return res.status(400).json({ message: 'Нет ID трека' })

        // Ищем или создаем системный плейлист "Мне нравится" для текущего юзера
        let likedPlaylist = await Playlist.findOne({ ownerId: req.userId, name: 'Мне нравится' })

        if (!likedPlaylist) {
            likedPlaylist = await Playlist.create({
                name: 'Мне нравится',
                description: 'Ваши любимые треки',
                ownerId: req.userId,
                tracks: [],
                isSystem: true // 👈 помечаем как системный
            })
        }

        // Проверяем, есть ли трек уже в лайках
        const isLiked = likedPlaylist.tracks.includes(trackId)

        const updateOperation = isLiked
            ? { $pull: { tracks: trackId } }   // Удаляем, если уже был лайк
            : { $addToSet: { tracks: trackId } } // Добавляем, если не было

        const updated = await Playlist.findOneAndUpdate(
            { _id: likedPlaylist._id, ownerId: req.userId },
            updateOperation,
            { new: true }
        ).populate('tracks')

        res.status(200).json({
            isLiked: !isLiked,
            playlist: updated
        })
    } catch (error) {
        console.error('Ошибка обработки лайка:', error)
        res.status(500).json({ message: 'Ошибка сервера при лайке трека' })
    }
})

export default router