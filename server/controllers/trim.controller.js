import Track from '../models/Track.js'
import User from '../models/User.js'
import { uploadToR2 } from '../service/r2.js'
import { trimTrack, MIN_LEN, MAX_LEN } from '../service/trimmer.js'
import { enqueueTrackProcessing } from '../service/track-pipeline.js'

const round2 = (n) => Math.round(n * 100) / 100

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export const createTrimmedTrack = async (req, res) => {
    try {
        const source = await Track.findById(req.params.id)
        if (!source) return res.status(404).json({ message: 'Трек не найден' })

        const start = Number(req.body?.start)
        const end = Number(req.body?.end)

        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0) {
            return res.status(400).json({ message: 'Некорректные границы отрезка' })
        }
        if (end - start < MIN_LEN) {
            return res.status(400).json({ message: `Отрезок должен быть не короче ${MIN_LEN} секунды` })
        }
        if (end - start > MAX_LEN) {
            return res.status(400).json({ message: 'Отрезок не может быть длиннее 15 минут' })
        }

        const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : ''
        const title = rawTitle || `${source.title} (${fmt(start)}–${fmt(end)})`

        const { buffer, size } = await trimTrack(source, round2(start), round2(end))

        const fileUrl = await uploadToR2(
            { originalname: 'trimmed.mp3', buffer, mimetype: 'audio/mpeg' },
            'tracks'
        )

        const track = await Track.create({
            userId: req.userId,
            title,
            artist: source.artist,
            coverUrl: source.coverUrl, // обложка общая с оригиналом
            fileUrl,
            fileSize: size,
            isSeed: false,
            isStreamed: false,
            parentId: source._id,
            trimStart: round2(start),
            trimEnd: round2(end),
        })

        // BPM, тональность и волна посчитаются в фоне
        enqueueTrackProcessing(track._id)

        const user = await User.findById(req.userId).select('email name').lean()

        res.status(201).json({
            track: { ...track.toObject(), authorEmail: user ? user.name || user.email : '' },
        })
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message })
        console.error('[Trim Error]:', error)
        res.status(500).json({ message: 'Не удалось обрезать трек' })
    }
}