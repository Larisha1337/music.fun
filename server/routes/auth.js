import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import User from '../models/User.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_PASSWORD = 8
const MAX_PASSWORD_BYTES = 72 // bcrypt игнорирует всё, что длиннее 72 байт

// Хеш-пустышка: сравниваем с ним, когда пользователя нет, чтобы по времени ответа
// нельзя было узнать, зарегистрирован ли email
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10)

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true, // считаем только неудачные попытки
    message: { message: 'Слишком много попыток входа. Попробуйте через 15 минут' },
})

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Слишком много регистраций с этого адреса. Попробуйте позже' },
})

const readCredentials = (body) => ({
    rawEmail: typeof body?.email === 'string' ? body.email.trim() : '',
    password: typeof body?.password === 'string' ? body.password : '',
})

const signToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { rawEmail, password } = readCredentials(req.body)

        if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 254) {
            return res.status(400).json({ message: 'Введите корректный email' })
        }
        if (password.length < MIN_PASSWORD) {
            return res.status(400).json({ message: `Пароль должен быть не короче ${MIN_PASSWORD} символов` })
        }
        if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
            return res.status(400).json({ message: 'Пароль слишком длинный' })
        }

        // Новые email храним в нижнем регистре, но ищем и по старому написанию
        const email = rawEmail.toLowerCase()
        const existing = await User.findOne({ email: { $in: [rawEmail, email] } })
        if (existing) {
            return res.status(400).json({ message: 'Такой email уже занят' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ email, password: hashedPassword })

        res.status(201).json({ token: signToken(user._id), userId: user._id })
    } catch (error) {
        // Два одновременных запроса с одним email: сработал unique-индекс
        if (error?.code === 11000) {
            return res.status(400).json({ message: 'Такой email уже занят' })
        }
        console.error(error)
        res.status(500).json({ message: 'Ошибка регистрации' })
    }
})

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { rawEmail, password } = readCredentials(req.body)

        if (!rawEmail || !password || rawEmail.length > 254 || password.length > 200) {
            return res.status(400).json({ message: 'Неверный email или пароль' })
        }

        // Здесь минимальную длину пароля не проверяем: у старых пользователей он может быть короче
        const user = await User.findOne({ email: { $in: [rawEmail, rawEmail.toLowerCase()] } })
        const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH)

        if (!user || !isMatch) {
            return res.status(400).json({ message: 'Неверный email или пароль' })
        }

        res.json({ token: signToken(user._id), userId: user._id })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка входа' })
    }
})

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password')
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' })

        res.json({ user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка получения профиля' })
    }
})

export default router