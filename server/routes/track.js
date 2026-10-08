import express from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import authMiddleware from '../middleware/auth.js'
import { uploadTrack, uploadTrackCover, uploadTrackWithCover } from '../middleware/upload.js'

import {
    getAllTracks,
    getMyTracks,
    createTrack,
    updateTrackTitle,
    uploadCover,
    deleteCover,
    updateTrackFile,
    deleteTrack,
    streamTrackAudio,
    prefetchTrackAudio
} from '../controllers/track.controller.js'

import {
    getTrackPeaks,
    getSimilarTracks,
    getRecommended,
    searchDeezer,
    addFromDeezer
} from '../controllers/discover.controller.js'

const router = express.Router()

// Битый id в адресе: 404 вместо ошибки 500
router.param('id', (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Трек не найден' })
    next()
})

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (req) => req.userId,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Слишком много поисковых запросов, подождите минуту' },
})

// Каждый добавленный трек запускает скачивание, поэтому лимит строже
const addLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    keyGenerator: (req) => req.userId,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Можно добавлять до 30 треков в час' },
})

// 1. Глобальная лента
router.get('/', getAllTracks)

// 2. Мои треки
router.get('/my', authMiddleware, getMyTracks)

// 3. Рекомендации
router.get('/recommended', authMiddleware, getRecommended)

// 4. Deezer: поиск и добавление в библиотеку
router.get('/deezer/search', authMiddleware, searchLimiter, searchDeezer)
router.post('/deezer', authMiddleware, addLimiter, addFromDeezer)

// 5. Загрузить новый трек
router.post('/', authMiddleware, uploadTrackWithCover.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), createTrack)

// 6. Обновить название трека
router.put('/:id', authMiddleware, updateTrackTitle)

// 7. Загрузить/заменить обложку
router.post('/:id/cover', authMiddleware, uploadTrackCover.single('cover'), uploadCover)

// 8. Удалить обложку
router.delete('/:id/cover', authMiddleware, deleteCover)

// 9. Заменить аудиофайл
router.put('/:id/file', authMiddleware, uploadTrack.single('file'), updateTrackFile)

// 10. Удалить трек целиком
router.delete('/:id', authMiddleware, deleteTrack)

// Стриминг по ID трека (R2 или YouTube-кэш)
router.get('/:id/stream', streamTrackAudio)

// Волна и похожие треки
router.get('/:id/peaks', getTrackPeaks)
router.get('/:id/similar', getSimilarTracks)

// Подгрузка в кэш заранее
router.post('/:id/prefetch', prefetchTrackAudio)

export default router