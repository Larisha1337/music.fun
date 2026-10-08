import express from 'express'
import mongoose from 'mongoose'
import authMiddleware from '../middleware/auth.js'
import { uploadPlaylistCover } from '../middleware/upload.js'
import { uploadToR2, deleteFromR2 } from '../service/r2.js'
import Playlist from '../models/Playlist.js'
import Track from '../models/Track.js'

const router = express.Router()

const LIKED_NAME = 'Мне нравится'
const isId = (v) => mongoose.isValidObjectId(v)
// Принимаем только ссылки http(s) и старые локальные пути; чужие схемы (javascript: и т.п.) отбрасываем
const isSafeCoverUrl = (v) => typeof v === 'string' && /^(https?:\/\/|\/uploads\/)/.test(v)

// Применяем авторизацию ко всем роутам ниже
router.use(authMiddleware)

// Битый id в адресе: 404 вместо ошибки 500
router.param('id', (req, res, next, id) => {
    if (!isId(id)) return res.status(404).json({ message: 'Плейлист не найден' })
    next()
})

// 1. Получить МОИ плейлисты (для сайдбара)
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist.find(
            { ownerId: req.userId },
            'name coverUrl tracks isSystem'
        ).sort({ createdAt: -1 })
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

// 3. Создать плейлист (обложка уходит в R2)
router.post('/', uploadPlaylistCover.single('cover'), async (req, res) => {
    try {
        const body = req.body || {}
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        const description = typeof body.description === 'string' ? body.description.trim() : ''

        if (!name) return res.status(400).json({ message: 'Название обязательно' })
        if (name.length > 100) return res.status(400).json({ message: 'Название слишком длинное' })
        if (name === LIKED_NAME) {
            return res.status(400).json({ message: 'Это название зарезервировано системой' })
        }

        let coverUrl = null
        if (req.file) {
            coverUrl = await uploadToR2(req.file, 'playlist-covers')
        } else if (isSafeCoverUrl(body.coverUrl)) {
            coverUrl = body.coverUrl
        }

        const newPlaylist = await Playlist.create({
            name,
            description,
            coverUrl,
            ownerId: req.userId
        })

        res.status(201).json(newPlaylist)
    } catch (error) {
        console.error('Ошибка создания плейлиста:', error)
        res.status(500).json({ message: 'Ошибка создания плейлиста' })
    }
})

// 4. Обновить плейлист (название, описание, обложка, порядок треков)
router.put('/:id', uploadPlaylistCover.single('cover'), async (req, res) => {
    try {
        const body = req.body || {}

        const existing = await Playlist.findOne({ _id: req.params.id, ownerId: req.userId })
        if (!existing) return res.status(404).json({ message: 'Плейлист не найден' })

        const updateData = {}

        // Системный плейлист «Мне нравится» переименовывать нельзя
        if (typeof body.name === 'string' && body.name.trim() && !existing.isSystem) {
            const name = body.name.trim()
            if (name.length > 100) return res.status(400).json({ message: 'Название слишком длинное' })
            if (name === LIKED_NAME) {
                return res.status(400).json({ message: 'Это название зарезервировано системой' })
            }
            updateData.name = name
        }

        if (typeof body.description === 'string') updateData.description = body.description.trim()

        // Новый порядок треков (из FormData приходит JSON-строка или массив)
        if (body.tracks !== undefined) {
            let tracks
            try {
                tracks = typeof body.tracks === 'string' ? JSON.parse(body.tracks) : body.tracks
            } catch {
                return res.status(400).json({ message: 'Некорректный список треков' })
            }

            if (!Array.isArray(tracks)) {
                return res.status(400).json({ message: 'Некорректный список треков' })
            }

            const ids = tracks.map((t) => (t && typeof t === 'object' ? t._id : t))
            if (!ids.every(isId)) {
                return res.status(400).json({ message: 'Некорректный id трека в списке' })
            }
            updateData.tracks = ids
        }

        if (req.file) {
            updateData.coverUrl = await uploadToR2(req.file, 'playlist-covers')
        } else if (isSafeCoverUrl(body.coverUrl)) {
            updateData.coverUrl = body.coverUrl
        }

        const updated = await Playlist.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.userId },
            updateData,
            { new: true }
        ).populate('tracks')

        if (!updated) return res.status(404).json({ message: 'Плейлист не найден' })

        // Старая обложка больше не нужна (deleteFromR2 сам пропускает ссылки не из нашего хранилища)
        if (existing.coverUrl && existing.coverUrl !== updated.coverUrl) {
            await deleteFromR2(existing.coverUrl)
        }

        res.status(200).json(updated)
    } catch (error) {
        console.error('Ошибка обновления:', error)
        res.status(500).json({ message: 'Ошибка обновления' })
    }
})

// 5. Удалить плейлист
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Playlist.findOneAndDelete({
            _id: req.params.id,
            ownerId: req.userId,
            isSystem: { $ne: true } // «Мне нравится» удалить нельзя
        })
        if (!deleted) {
            return res.status(404).json({ message: 'Плейлист не найден или является системным' })
        }

        if (deleted.coverUrl) await deleteFromR2(deleted.coverUrl)

        res.status(200).json({ message: 'Удалено', id: req.params.id })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления' })
    }
})

// 6. Добавить трек в плейлист
router.post('/:id/tracks', async (req, res) => {
    try {
        const { trackId } = req.body || {}
        if (!isId(trackId)) return res.status(400).json({ message: 'Нет ID трека' })

        if (!(await Track.exists({ _id: trackId }))) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

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
        if (!isId(req.params.trackId)) return res.status(400).json({ message: 'Некорректный ID трека' })

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

// 8. Лайк / Дизлайк трека (управляет системным плейлистом «Мне нравится»)
router.post('/liked/toggle', async (req, res) => {
    try {
        const { trackId } = req.body || {}
        if (!isId(trackId)) return res.status(400).json({ message: 'Нет ID трека' })

        if (!(await Track.exists({ _id: trackId }))) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        // Ищем системный плейлист (старые записи без флага находим по названию)
        let liked = await Playlist.findOne({
            ownerId: req.userId,
            $or: [{ isSystem: true }, { name: LIKED_NAME }]
        })

        // Создаём атомарно: два быстрых клика не породят два плейлиста
        if (!liked) {
            liked = await Playlist.findOneAndUpdate(
                { ownerId: req.userId, isSystem: true },
                { $setOnInsert: { name: LIKED_NAME, description: 'Ваши любимые треки', tracks: [] } },
                { upsert: true, new: true }
            )
        }

        const isLiked = liked.tracks.some((id) => id.toString() === trackId)

        const updated = await Playlist.findOneAndUpdate(
            { _id: liked._id, ownerId: req.userId },
            isLiked ? { $pull: { tracks: trackId } } : { $addToSet: { tracks: trackId } },
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