import express from 'express'
import fs from 'fs'
import path from 'path'
import uploadTrack from '../middleware/upload-track.js'
import uploadTrackCover from '../middleware/upload-track-cover.js'
import authMiddleware from '../middleware/auth.js'
import Track from '../models/Track.js'

const router = express.Router()

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

// Загрузить/заменить обложку трека
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
            const oldPath = path.join('uploads/track-covers', path.basename(track.coverUrl))
            fs.unlink(oldPath, (err) => {
                if (err) console.error('Не удалось удалить старую обложку:', err)
            })
        }

        track.coverUrl = `/uploads/track-covers/${req.file.filename}`
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при загрузке обложки' })
    }
})

// Удалить обложку трека
router.delete('/:id/cover', authMiddleware, async (req, res) => {
    try {
        const track = await Track.findOne({ _id: req.params.id, userId: req.userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.coverUrl) {
            const filePath = path.join('uploads/track-covers', path.basename(track.coverUrl))
            fs.unlink(filePath, (err) => {
                if (err) console.error('Не удалось удалить файл обложки:', err)
            })
        }

        track.coverUrl = null
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления обложки' })
    }
})

router.get('/my', authMiddleware, async (req, res) => {
    try {
        const tracks = await Track.find({ userId: req.userId }).sort({ createdAt: -1 })
        res.json({ tracks })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
})

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const track = await Track.findOne({ _id: req.params.id, userId: req.userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        const filePath = path.join('uploads/tracks', path.basename(track.fileUrl))
        fs.unlink(filePath, (err) => {
            if (err) console.error('Не удалось удалить файл:', err)
        })

        if (track.coverUrl) {
            const coverPath = path.join('uploads/track-covers', path.basename(track.coverUrl))
            fs.unlink(coverPath, (err) => {
                if (err) console.error('Не удалось удалить файл обложки:', err)
            })
        }

        await track.deleteOne()
        res.json({ message: 'Удалено' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
})

export default router