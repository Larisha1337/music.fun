import express from 'express'
import fs from 'fs'
import path from 'path'
import uploadTrack from '../middleware/upload-track.js'
import uploadTrackCover from '../middleware/upload-track-cover.js'
import authMiddleware from '../middleware/auth.js'
import Track from '../models/Track.js'
import User from '../models/User.js'

const router = express.Router()

// 1. Глобальная лента (автоочистка битых MP3 и обложек)
router.get('/', async (req, res) => {
    try {
        const tracks = await Track.find().sort({ createdAt: -1 }).lean()
        const validTracks = []

        for (const track of tracks) {
            const filePath = path.join(process.cwd(), track.fileUrl)

            if (fs.existsSync(filePath)) {
                // Если MP3 на месте, проверяем обложку. Если обложку удалили — сбрасываем её в null
                if (track.coverUrl) {
                    const coverPath = path.join(process.cwd(), track.coverUrl)
                    if (!fs.existsSync(coverPath)) {
                        await Track.updateOne({ _id: track._id }, { coverUrl: null })
                        track.coverUrl = null
                    }
                }
                validTracks.push(track)
            } else {
                // MP3 файла нет — удаляем трек из базы
                await Track.deleteOne({ _id: track._id })
                console.log(`[Auto-Clean] Удален битый трек из БД: ${track.title}`)
            }
        }

        const userIds = [...new Set(validTracks.map(t => t.userId))]
        const users = await User.find({ _id: { $in: userIds } }).select('email').lean()
        const emailById = Object.fromEntries(users.map(u => [u._id.toString(), u.email]))

        const tracksWithAuthor = validTracks.map(t => ({
            ...t,
            authorEmail: emailById[t.userId] ?? 'Unknown'
        }))

        res.json({ tracks: tracksWithAuthor })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
})

// 2. Мои треки (тоже с авточисткой)
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const tracks = await Track.find({ userId: req.userId }).sort({ createdAt: -1 }).lean()
        const validTracks = []

        for (const track of tracks) {
            const filePath = path.join(process.cwd(), track.fileUrl)
            if (fs.existsSync(filePath)) {
                if (track.coverUrl) {
                    const coverPath = path.join(process.cwd(), track.coverUrl)
                    if (!fs.existsSync(coverPath)) {
                        await Track.updateOne({ _id: track._id }, { coverUrl: null })
                        track.coverUrl = null
                    }
                }
                validTracks.push(track)
            } else {
                await Track.deleteOne({ _id: track._id })
            }
        }

        res.json({ tracks: validTracks })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
})

// 3. Загрузить новый трек
router.post('/', authMiddleware, uploadTrack.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' })
        }

        const fileUrl = `/uploads/tracks/${req.file.filename}`

        const track = await Track.create({
            userId: req.userId,
            title: req.body.title || req.file.originalname,
            fileUrl,
            fileSize: req.file.size
        })

        res.status(201).json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при загрузке трека' })
    }
})

// 4. Обновить название
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const track = await Track.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { title: req.body.title },
            { new: true }
        )

        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка обновления трека' })
    }
})

// 5. Загрузить/заменить обложку
router.post('/:id/cover', authMiddleware, uploadTrackCover.single('cover'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' })
        }

        const track = await Track.findOne({ _id: req.params.id, userId: req.userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.coverUrl) {
            const oldPath = path.join(process.cwd(), track.coverUrl)
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        track.coverUrl = `/uploads/track-covers/${req.file.filename}`
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при загрузке обложки' })
    }
})

// 6. Удалить обложку
router.delete('/:id/cover', authMiddleware, async (req, res) => {
    try {
        const track = await Track.findOne({ _id: req.params.id, userId: req.userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.coverUrl) {
            const filePath = path.join(process.cwd(), track.coverUrl)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }

        track.coverUrl = null
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления обложки' })
    }
})

// 7. Заменить аудиофайл
router.put('/:id/file', authMiddleware, uploadTrack.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Аудиофайл не передан' })
        }

        const track = await Track.findOne({ _id: req.params.id, userId: req.userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.fileUrl) {
            const oldPath = path.join(process.cwd(), track.fileUrl)
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        track.fileUrl = `/uploads/tracks/${req.file.filename}`
        track.fileSize = req.file.size
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при обновлении аудиофайла' })
    }
})

// 8. Удалить трек целиком
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const track = await Track.findOne({ _id: req.params.id, userId: req.userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.fileUrl) {
            const filePath = path.join(process.cwd(), track.fileUrl)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }

        if (track.coverUrl) {
            const coverPath = path.join(process.cwd(), track.coverUrl)
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath)
        }

        await track.deleteOne()
        res.json({ message: 'Удалено' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
})

export default router