import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {uploadTrack, uploadTrackCover, uploadTrackWithCover} from '../middleware/upload.js'
import { streamTrackAudio } from '../controllers/track.controller.js';

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
router.post('/', authMiddleware, uploadTrackWithCover.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), createTrack);

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

// Роут для стриминга по ID трека
router.get('/:id/stream', streamTrackAudio);

export default router