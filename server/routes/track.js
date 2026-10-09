import express from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import authMiddleware from '../middleware/auth.js'
import { uploadTrack, uploadTrackCover, uploadTrackWithCover } from '../middleware/upload.js'

import {
    getAllTracks,
    getTrackFacets,
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

const limiter = (windowMs, limit, message) =>
    rateLimit({
        windowMs,
        limit,
        keyGenerator: (req) => req.userId,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { message },
    })

const searchLimiter = limiter(60 * 1000, 60, 'Слишком много поисковых запросов, подождите минуту')
// Каждый добавленный трек запускает скачивание, поэтому лимит строже
const addLimiter = limiter(60 * 60 * 1000, 30, 'Можно добавлять до 30 треков в час')
const prefetchLimiter = limiter(60 * 60 * 1000, 200, 'Слишком много запросов подготовки треков')

// 1. Глобальная лента и данные для фильтров
router.get('/', getAllTracks)
router.get('/facets', getTrackFacets)

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

// Стриминг по ID трека (R2 или YouTube-кэш). Без авторизации: тег <audio> не умеет слать заголовки
router.get('/:id/stream', streamTrackAudio)

// Волна и похожие треки
router.get('/:id/peaks', getTrackPeaks)
router.get('/:id/similar', getSimilarTracks)

// Подготовка трека заранее: теперь только для вошедших и с лимитом
router.post('/:id/prefetch', authMiddleware, prefetchLimiter, prefetchTrackAudio)

export default router