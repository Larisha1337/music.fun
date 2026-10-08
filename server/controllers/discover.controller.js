import mongoose from 'mongoose'
import Track from '../models/Track.js'
import Playlist from '../models/Playlist.js'
import Play from '../models/Play.js'
import { enqueueTrackProcessing } from '../service/track-pipeline.js'
import { keyRelation, keyScore, bpmDistance } from '../service/camelot.js'

const isId = (v) => mongoose.isValidObjectId(v)
const LIST_FIELDS = 'title artist coverUrl fileUrl bpm musicalKey createdAt isStreamed'
const clampInt = (v, min, max, fallback) => Math.min(Math.max(parseInt(v, 10) || fallback, min), max)

/* ---------- Волна ---------- */

export const getTrackPeaks = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id).select('+peaks').lean()
        if (!track?.peaks?.length) return res.status(204).end()

        res.set('Cache-Control', 'public, max-age=3600')
        res.json({ peaks: track.peaks })
    } catch (error) {
        console.error('[Peaks Error]:', error)
        res.status(500).json({ message: 'Ошибка получения волны' })
    }
}

/* ---------- Похожие треки ---------- */

export const getSimilarTracks = async (req, res) => {
    try {
        const base = await Track.findById(req.params.id).select('artist bpm musicalKey').lean()
        if (!base) return res.status(404).json({ message: 'Трек не найден' })

        if (!base.bpm && !base.musicalKey) return res.json({ analyzed: false, tracks: [] })

        const candidates = await Track.find({
            _id: { $ne: base._id },
            $or: [{ bpm: { $ne: null } }, { musicalKey: { $ne: null } }],
        })
            .select(LIST_FIELDS)
            .lean()

        const scored = []
        for (const t of candidates) {
            const dist = bpmDistance(base.bpm, t.bpm)
            const relation = keyRelation(base.musicalKey, t.musicalKey)

            let score = 0
            if (dist !== null) score += Math.max(0, 1 - dist / 12) * 5
            score += keyScore(relation) * 3
            if (base.artist && t.artist && base.artist.toLowerCase() === t.artist.toLowerCase()) score += 1.5

            if (score >= 2) scored.push({ t, score, dist, relation })
        }

        scored.sort((a, b) => b.score - a.score)

        res.json({
            analyzed: true,
            tracks: scored.slice(0, 12).map(({ t, dist, relation }) => ({
                ...t,
                bpmDiff: dist,
                keyMatch: relation,
            })),
        })
    } catch (error) {
        console.error('[Similar Error]:', error)
        res.status(500).json({ message: 'Ошибка подбора похожих треков' })
    }
}

/* ---------- История ---------- */

export const recordPlay = async (req, res) => {
    try {
        const { trackId } = req.body || {}
        if (!isId(trackId)) return res.status(400).json({ message: 'Нет ID трека' })

        if (!(await Track.exists({ _id: trackId }))) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        // Повтор того же трека в течение минуты не считаем новым прослушиванием
        const last = await Play.findOne({ userId: req.userId }).sort({ playedAt: -1 }).lean()
        if (last && String(last.trackId) === trackId && Date.now() - last.playedAt.getTime() < 60_000) {
            return res.json({ ok: true, skipped: true })
        }

        await Play.create({ userId: req.userId, trackId })
        res.status(201).json({ ok: true })
    } catch (error) {
        console.error('[Play Error]:', error)
        res.status(500).json({ message: 'Ошибка записи прослушивания' })
    }
}

export const getRecent = async (req, res) => {
    try {
        const limit = clampInt(req.query.limit, 1, 50, 20)

        const rows = await Play.aggregate([
            { $match: { userId: req.userId } },
            { $sort: { playedAt: -1 } },
            { $limit: 300 },
            { $group: { _id: '$trackId', last: { $first: '$playedAt' } } },
            { $sort: { last: -1 } },
            { $limit: limit },
        ])

        const tracks = await Track.find({ _id: { $in: rows.map((r) => r._id) } })
            .select(LIST_FIELDS)
            .lean()

        const byId = new Map(tracks.map((t) => [String(t._id), t]))
        res.json({ tracks: rows.map((r) => byId.get(String(r._id))).filter(Boolean) })
    } catch (error) {
        console.error('[Recent Error]:', error)
        res.status(500).json({ message: 'Ошибка получения истории' })
    }
}

/* ---------- Рекомендации ---------- */

export const getRecommended = async (req, res) => {
    try {
        const userId = req.userId
        const limit = clampInt(req.query.limit, 1, 30, 12)

        const [liked, plays] = await Promise.all([
            Playlist.findOne({ ownerId: userId, $or: [{ isSystem: true }, { name: 'Мне нравится' }] })
                .select('tracks')
                .lean(),
            Play.aggregate([
                { $match: { userId } },
                { $sort: { playedAt: -1 } },
                { $limit: 300 },
                { $group: { _id: '$trackId', count: { $sum: 1 } } },
            ]),
        ])

        const likedIds = new Set((liked?.tracks || []).map(String))
        const playedIds = new Set(plays.map((p) => String(p._id)))

        // Вес «улик»: лайк весит больше, чем прослушивание
        const seedWeights = new Map()
        for (const id of likedIds) seedWeights.set(id, 3)
        for (const p of plays) {
            const id = String(p._id)
            seedWeights.set(id, (seedWeights.get(id) || 0) + Math.min(p.count, 5) * 0.6)
        }

        const candidates = await Track.find({ _id: { $nin: [...likedIds] } })
            .select(LIST_FIELDS)
            .limit(2000)
            .lean()

        // Мало данных: показываем свежие треки вперемешку
        if (seedWeights.size === 0) {
            const fresh = [...candidates]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 40)
                .sort(() => Math.random() - 0.5)
                .slice(0, limit)
            return res.json({ tracks: fresh.map((t) => ({ ...t, reason: 'Новое в библиотеке' })) })
        }

        const seeds = await Track.find({ _id: { $in: [...seedWeights.keys()] } })
            .select('artist bpm musicalKey')
            .lean()

        const artistWeight = new Map()
        let maxArtistWeight = 0
        for (const s of seeds) {
            const w = seedWeights.get(String(s._id)) || 0
            if (s.artist) {
                const key = s.artist.toLowerCase()
                const total = (artistWeight.get(key) || 0) + w
                artistWeight.set(key, total)
                maxArtistWeight = Math.max(maxArtistWeight, total)
            }
        }

        const bpmSeeds = seeds.filter((s) => s.bpm).map((s) => ({ bpm: s.bpm, w: seedWeights.get(String(s._id)) || 0 }))
        const keySeeds = seeds.filter((s) => s.musicalKey).map((s) => ({ key: s.musicalKey, w: seedWeights.get(String(s._id)) || 0 }))
        const bpmWeightSum = bpmSeeds.reduce((a, s) => a + s.w, 0)
        const keyWeightSum = keySeeds.reduce((a, s) => a + s.w, 0)

        const scored = candidates.map((t) => {
            let artistScore = 0
            if (t.artist && maxArtistWeight > 0) {
                artistScore = ((artistWeight.get(t.artist.toLowerCase()) || 0) / maxArtistWeight) * 4
            }

            let bpmScore = 0
            if (t.bpm && bpmWeightSum > 0) {
                let sum = 0
                for (const s of bpmSeeds) sum += s.w * Math.max(0, 1 - (bpmDistance(t.bpm, s.bpm) ?? 99) / 15)
                bpmScore = (sum / bpmWeightSum) * 2
            }

            let keyScoreValue = 0
            if (t.musicalKey && keyWeightSum > 0) {
                let sum = 0
                for (const s of keySeeds) sum += s.w * keyScore(keyRelation(t.musicalKey, s.key))
                keyScoreValue = (sum / keyWeightSum) * 1.5
            }

            const known = playedIds.has(String(t._id)) ? -1 : 0
            const score = artistScore + bpmScore + keyScoreValue + known + Math.random() * 0.6

            const reason =
                artistScore >= 1.5
                    ? `Вам нравится ${t.artist}`
                    : bpmScore + keyScoreValue >= 1.5
                        ? 'Похоже по звучанию на ваши треки'
                        : 'Новое для вас'

            return { t, score, reason }
        })

        scored.sort((a, b) => b.score - a.score)
        res.json({ tracks: scored.slice(0, limit).map(({ t, reason }) => ({ ...t, reason })) })
    } catch (error) {
        console.error('[Recommended Error]:', error)
        res.status(500).json({ message: 'Ошибка получения рекомендаций' })
    }
}

/* ---------- Deezer ---------- */

const deezerFetch = async (path) => {
    const response = await fetch(`https://api.deezer.com${path}`, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`Deezer HTTP ${response.status}`)
    return response.json()
}

export const searchDeezer = async (req, res) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''
        if (q.length < 2) return res.json({ results: [] })

        const data = await deezerFetch(`/search?q=${encodeURIComponent(q)}&limit=15`)

        const items = (data.data || [])
            .filter((t) => t?.id && t.title && t.artist?.name)
            .map((t) => ({
                deezerId: String(t.id),
                title: t.title,
                artist: t.artist.name,
                album: t.album?.title || '',
                cover: t.album?.cover_medium || null,
                duration: t.duration || 0,
            }))

        if (items.length === 0) return res.json({ results: [] })

        // Помечаем то, что уже есть в библиотеке
        const [byId, byName] = await Promise.all([
            Track.find({ deezerId: { $in: items.map((i) => i.deezerId) } }).select('deezerId').lean(),
            Track.find({ $or: items.map((i) => ({ title: i.title, artist: i.artist })) })
                .select('title artist')
                .lean(),
        ])

        const idSet = new Set(byId.map((t) => t.deezerId))
        const nameSet = new Set(byName.map((t) => `${t.title}||${t.artist}`))

        res.json({
            results: items.map((i) => ({
                ...i,
                exists: idSet.has(i.deezerId) || nameSet.has(`${i.title}||${i.artist}`),
            })),
        })
    } catch (error) {
        console.error('[Deezer Search Error]:', error.message)
        res.status(502).json({ message: 'Deezer сейчас недоступен' })
    }
}

export const addFromDeezer = async (req, res) => {
    try {
        const deezerId = String(req.body?.deezerId ?? '').trim()
        if (!/^\d{1,12}$/.test(deezerId)) return res.status(400).json({ message: 'Некорректный id трека' })

        const byId = await Track.findOne({ deezerId })
        if (byId) return res.json({ track: byId, existing: true })

        let data
        try {
            data = await deezerFetch(`/track/${deezerId}`)
        } catch (error) {
            console.error('[Deezer Track Error]:', error.message)
            return res.status(502).json({ message: 'Deezer сейчас недоступен' })
        }

        if (data?.error || !data?.title || !data?.artist?.name) {
            return res.status(404).json({ message: 'Трек не найден в Deezer' })
        }

        const title = data.title
        const artist = data.artist.name

        const byName = await Track.findOne({ title, artist })
        if (byName) return res.json({ track: byName, existing: true })

        const track = await Track.create({
            userId: req.userId,
            title,
            artist,
            coverUrl: data.album?.cover_big || data.album?.cover_medium || null,
            fileUrl: '',
            isSeed: false,
            isStreamed: true,
            deezerId,
        })

        // Скачивание, загрузка в R2 и анализ идут в фоне
        enqueueTrackProcessing(track._id)

        res.status(201).json({ track, existing: false })
    } catch (error) {
        console.error('[Add Deezer Error]:', error)
        res.status(500).json({ message: 'Не удалось добавить трек' })
    }
}