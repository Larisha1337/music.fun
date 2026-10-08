import express from 'express'
import rateLimit from 'express-rate-limit'
import authMiddleware from '../middleware/auth.js'
import { recordPlay, getRecent } from '../controllers/discover.controller.js'

const router = express.Router()

router.use(authMiddleware)

const playLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 400,
    keyGenerator: (req) => req.userId,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})

router.post('/play', playLimiter, recordPlay)
router.get('/recent', getRecent)

export default router