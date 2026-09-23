import multer from 'multer'

const storage = multer.memoryStorage()

// 1. Аватарка (до 5 МБ)
export const uploadAvatar = multer({
    storage,
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
    storage,
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
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Можно загружать только изображения'))
        }
    }
})