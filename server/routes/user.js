import express from 'express'
import fs from 'fs'
import path from 'path'
import { uploadAvatar } from '../middleware/upload.js'
import authMiddleware from '../middleware/auth.js'
import Avatar from '../models/Avatar.js'
import User from '../models/User.js' // <-- Добавили импорт модели юзера

const router = express.Router()

// 1. Загрузка аватарки
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' })
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`

        const existingAvatar = await Avatar.findOne({ userId: req.userId })

        const avatar = await Avatar.findOneAndUpdate(
            { userId: req.userId },
            { avatarUrl },
            { upsert: true, new: true }
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

// 2. Получение аватарки
router.get('/avatar', authMiddleware, async (req, res) => {
    try {
        const avatar = await Avatar.findOne({ userId: req.userId })
        res.json({ avatarUrl: avatar?.avatarUrl ?? null })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения аватарки' })
    }
})

// 3. Обновление ника (имени)
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Имя не может быть пустым' })
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { name: name.trim() },
            { new: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        res.json({ user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при обновлении профиля' })
    }
})

export default router