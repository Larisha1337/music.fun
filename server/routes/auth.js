import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body

        const existing = await User.findOne({ email })
        if (existing) {
            return res.status(400).json({ message: 'Такой email уже занят' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ email, password: hashedPassword })

        res.status(201).json({ message: 'Зарегистрирован', userId: user._id })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка регистрации' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: 'Неверный email или пароль' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный email или пароль' })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.json({ token, avatarUrl: user.avatarUrl })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка входа' })
    }
})

export default router