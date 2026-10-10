import mongoose from 'mongoose'
import Track from '../models/Track.js'
import User from '../models/User.js'
import { uploadToR2 } from '../service/r2.js'
import {
    composeTracks,
    MIN_LEN,
    MAX_LEN,
    MAX_SEGMENTS,
    MAX_TOTAL,
    MAX_SOURCES,
} from '../service/trimmer.js'
import { enqueueTrackProcessing } from '../service/track-pipeline.js'

const round2 = (n) => Math.round(n * 100) / 100
const ALLOWED_FADES = [0, 0.5, 1, 2]

const bad = (res, message, status = 400) => res.status(status).json({ message })

export const createCompilation = async (req, res) => {
    try {
        const raw = Array.isArray(req.body?.segments) ? req.body.segments : null
        if (!raw || raw.length < 2) return bad(res, 'Добавьте минимум 2 отрезка')
        if (raw.length > MAX_SEGMENTS) return bad(res, `В сборке может быть не больше ${MAX_SEGMENTS} отрезков`)

        const crossfade = Number(req.body?.crossfade ?? 0)
        if (!ALLOWED_FADES.includes(crossfade)) return bad(res, 'Недопустимая длина перехода')

        const segs = []
        let total = 0

        for (const s of raw) {
            const start = Number(s?.start)
            const end = Number(s?.end)

            if (!mongoose.isValidObjectId(s?.trackId) || !Number.isFinite(start) || !Number.isFinite(end) || start < 0) {
                return bad(res, 'Некорректный отрезок в сборке')
            }

            const len = end - start
            if (len < MIN_LEN || len > MAX_LEN) return bad(res, 'Каждый отрезок должен быть от 1 секунды до 15 минут')

            total += len
            segs.push({ trackId: String(s.trackId), start: round2(start), end: round2(end) })
        }

        if (total > MAX_TOTAL) return bad(res, 'Сборка не может быть длиннее 30 минут')

        const ids = [...new Set(segs.map((s) => s.trackId))]
        if (ids.length > MAX_SOURCES) return bad(res, `Можно использовать не больше ${MAX_SOURCES} разных треков`)

        const tracks = await Track.find({ _id: { $in: ids } })
        if (tracks.length !== ids.length) return bad(res, 'Один из исходных треков не найден', 404)

        const byId = new Map(tracks.map((t) => [String(t._id), t]))
        const ordered = segs.map((s) => ({ track: byId.get(s.trackId), start: s.start, end: s.end }))

        const { buffer, size } = await composeTracks(ordered, crossfade)

        const fileUrl = await uploadToR2(
            { originalname: 'compilation.mp3', buffer, mimetype: 'audio/mpeg' },
            'tracks'
        )

        const artists = [...new Set(ordered.map((o) => o.track.artist).filter(Boolean))]
        const artist = artists.length === 0 ? '' : artists.length <= 2 ? artists.join(', ') : 'Разные исполнители'

        const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : ''

        const track = await Track.create({
            userId: req.userId,
            title: rawTitle || `Сборка из ${segs.length} отрезков`,
            artist,
            coverUrl: ordered.map((o) => o.track.coverUrl).find(Boolean) ?? null,
            fileUrl,
            fileSize: size,
            isSeed: false,
            isStreamed: false,
            sources: segs,
        })

        enqueueTrackProcessing(track._id)

        const user = await User.findById(req.userId).select('email name').lean()

        res.status(201).json({
            track: { ...track.toObject(), authorEmail: user ? user.name || user.email : '' },
        })
    } catch (error) {
        if (error.status) return bad(res, error.message, error.status)
        console.error('[Compose Error]:', error)
        res.status(500).json({ message: 'Не удалось собрать трек' })
    }
}