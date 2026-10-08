import multer from 'multer'

const MB = 1024 * 1024
const memory = multer.memoryStorage()

// Ошибки загрузки уходят клиенту как 400 (обработчик в server.js читает поле status)
const badRequest = (message) => Object.assign(new Error(message), { status: 400 })

// SVG намеренно не разрешён: из публичного хранилища он может выполнять скрипты
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

const imageFilter = (req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype)) cb(null, true)
    else cb(badRequest('Можно загружать только изображения (JPG, PNG, WebP, GIF, AVIF)'))
}

const isMp3 = (file) =>
    file.mimetype === 'audio/mpeg' || file.originalname.toLowerCase().endsWith('.mp3')

const mp3Filter = (req, file, cb) => {
    if (isMp3(file)) cb(null, true)
    else cb(badRequest('Можно загружать только mp3'))
}

// Аватарка (до 5 МБ)
export const uploadAvatar = multer({
    storage: memory,
    limits: { fileSize: 5 * MB },
    fileFilter: imageFilter,
})

// Обложка трека (до 5 МБ)
export const uploadTrackCover = multer({
    storage: memory,
    limits: { fileSize: 5 * MB },
    fileFilter: imageFilter,
})

// Обложка плейлиста (до 5 МБ)
export const uploadPlaylistCover = multer({
    storage: memory,
    limits: { fileSize: 5 * MB },
    fileFilter: imageFilter,
})

// Трек (до 50 МБ)
export const uploadTrack = multer({
    storage: memory,
    limits: { fileSize: 50 * MB },
    fileFilter: mp3Filter,
})

// Аудио и обложка трека одним запросом
export const uploadTrackWithCover = multer({
    storage: memory,
    limits: { fileSize: 50 * MB, files: 2 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'file') return mp3Filter(req, file, cb)
        if (file.fieldname === 'cover') return imageFilter(req, file, cb)
        cb(badRequest('Неизвестное поле файла'))
    },
})