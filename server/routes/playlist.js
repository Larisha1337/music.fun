import express from 'express'
import authMiddleware from '../middleware/auth.js'
import Playlist from '../models/Playlist.js'

const router = express.Router()

// Применяем middleware ко всем роутам ниже
router.use(authMiddleware)

// 1. Получить МОИ плейлисты (для сайдбара)
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist.find({ ownerId: req.userId }, 'name coverUrl').sort({ createdAt: -1 })
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

// 3. Создать плейлист
router.post('/', async (req, res) => {
    try {
        const { name, description, coverUrl } = req.body

        if (!name) return res.status(400).json({ message: 'Название обязательно' })

        const newPlaylist = await Playlist.create({
            name,
            description,
            coverUrl,
            ownerId: req.userId // Привязываем к создателю
        })

        res.status(201).json(newPlaylist)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка создания плейлиста' })
    }
})

// 4. Обновить плейлист (название, обложка)
router.put('/:id', async (req, res) => {
    try {
        const { name, description, coverUrl } = req.body

        const updated = await Playlist.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.userId }, // Ищем только среди своих
            { name, description, coverUrl },
            { new: true }
        )

        if (!updated) return res.status(404).json({ message: 'Плейлист не найден' })
        res.status(200).json(updated)
    } catch (error) {
        console.error(error)
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

export default router