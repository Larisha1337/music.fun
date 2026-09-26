import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Функция для автоматического создания папки, если её нет
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

// 1. Дисковое хранилище для аватарок
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/avatars'
        ensureDir(dir)
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`)
    }
})

export const uploadAvatar = multer({
    storage: avatarStorage, // 👈 используем diskStorage вместо memoryStorage
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Можно загружать только изображения'))
        }
    }
})

// 2. Трек (до 50 МБ)
export const uploadTrack = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isMp3 = file.mimetype === 'audio/mpeg' || file.originalname.toLowerCase().endsWith('.mp3')
        if (isMp3) {
            cb(null, true)
        } else {
            cb(new Error('Можно загружать только mp3'))
        }
    }
})

// 3. Обложка трека (до 5 МБ)
export const uploadTrackCover = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Можно загружать только изображения'))
        }
    }
})