import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { uploadTrack, uploadTrackCover } from '../middleware/upload.js'

import {
    getAllTracks,
    getMyTracks,
    createTrack,
    updateTrackTitle,
    uploadCover,
    deleteCover,
    updateTrackFile,
    deleteTrack
} from '../controllers/track.controller.js'

const router = express.Router()

// 1. Глобальная лента
router.get('/', getAllTracks)

// 2. Мои треки
router.get('/my', authMiddleware, getMyTracks)

// 3. Загрузить новый трек
router.post('/', authMiddleware, uploadTrack.single('file'), createTrack)

// 4. Обновить название трека
router.put('/:id', authMiddleware, updateTrackTitle)

// 5. Загрузить/заменить обложку
router.post('/:id/cover', authMiddleware, uploadTrackCover.single('cover'), uploadCover)

// 6. Удалить обложку
router.delete('/:id/cover', authMiddleware, deleteCover)

// 7. Заменить аудиофайл
router.put('/:id/file', authMiddleware, uploadTrack.single('file'), updateTrackFile)

// 8. Удалить трек целиком
router.delete('/:id', authMiddleware, deleteTrack)

export default router