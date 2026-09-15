import express from 'express'
import fs from 'fs'
import path from 'path'
import upload from '../middleware/upload.js'
import authMiddleware from '../middleware/auth.js'
import Avatar from '../models/Avatar.js'

const router = express.Router()

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' })
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`

        // запоминаем старую аватарку до перезаписи, чтобы потом удалить файл с диска
        const existingAvatar = await Avatar.findOne({ userId: req.userId })

        const avatar = await Avatar.findOneAndUpdate(
            { userId: req.userId },
            { avatarUrl },
            { upsert: true, new: true } // upsert - создать запись, если её ещё не было
        )

        if (existingAvatar?.avatarUrl) {
            const oldFilePath = path.join('uploads/avatars', path.basename(existingAvatar.avatarUrl))
            fs.unlink(oldFilePath, (err) => {
                if (err) console.error('Не удалось удалить старый файл:', err)
            })
        }

        res.json({ avatarUrl: avatar.avatarUrl })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при загрузке' })
    }
})

router.get('/avatar', authMiddleware, async (req, res) => {
    try {
        const avatar = await Avatar.findOne({ userId: req.userId })
        res.json({ avatarUrl: avatar?.avatarUrl ?? null })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения аватарки' })
    }
})

export default router