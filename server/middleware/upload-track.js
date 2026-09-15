import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads/tracks'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, uniqueName + path.extname(file.originalname))
    }
})

const uploadTrack = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB - хватает на полноценную песню
    fileFilter: (req, file, cb) => {
        const isMp3 = file.mimetype === 'audio/mpeg' || file.originalname.toLowerCase().endsWith('.mp3')
        if (isMp3) {
            cb(null, true)
        } else {
            cb(new Error('Можно загружать только mp3'))
        }
    }
})

export default uploadTrack