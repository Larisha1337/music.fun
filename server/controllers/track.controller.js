import Track from '../models/Track.js'
import User from '../models/User.js'
import { uploadToR2, deleteFromR2, getFileStreamFromR2 } from '../service/r2.js'
import { ensureCached, mimeForFile } from '../service/audio-cache.js'
import { enqueueTrackProcessing } from '../service/track-pipeline.js'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 1. Глобальная лента (с авторами).
// Без параметров отдаёт всё, как раньше. Параметры: ?page=1&limit=30&q=поиск
export const getAllTracks = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 100)
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
        const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''

        const filter = {}
        if (q) {
            // Поиск по названию, исполнителю и имени/почте автора загрузки
            const rx = new RegExp(escapeRegex(q), 'i')
            const authors = await User.find({ $or: [{ name: rx }, { email: rx }] })
                .select('_id')
                .limit(50)
                .lean()

            filter.$or = [
                { title: rx },
                { artist: rx },
                { userId: { $in: authors.map((a) => a._id.toString()) } },
            ]
        }

        let query = Track.find(filter).sort({ createdAt: -1, _id: -1 })
        if (limit) query = query.skip((page - 1) * limit).limit(limit)

        const [tracks, total] = await Promise.all([
            query.lean(),
            limit ? Track.countDocuments(filter) : Promise.resolve(0),
        ])

        const userIds = [...new Set(
            tracks
                .filter((t) => t.userId && t.userId !== 'system')
                .map((t) => t.userId.toString())
        )]

        const users = await User.find({ _id: { $in: userIds } }).select('email name').lean()

        const authorById = Object.fromEntries(
            users.map((u) => [u._id.toString(), u.name || u.email])
        )

        const tracksWithAuthor = tracks.map((t) => ({
            ...t,
            authorEmail: t.userId && authorById[t.userId.toString()]
                ? authorById[t.userId.toString()]
                : 'Deezer / Chart'
        }))

        if (!limit) return res.json({ tracks: tracksWithAuthor })

        res.json({
            tracks: tracksWithAuthor,
            page,
            limit,
            total,
            hasMore: page * limit < total,
        })
    } catch (error) {
        console.error('[Error GET /api/tracks]:', error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
}

// 2. Мои треки
export const getMyTracks = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id

        if (!userId) {
            return res.status(401).json({ message: 'Неавторизован: ID пользователя не найден' })
        }

        const [tracks, user] = await Promise.all([
            Track.find({
                userId: userId,
                isSeed: { $ne: true }
            }).sort({ createdAt: -1 }).lean(),
            User.findById(userId).select('email name').lean()
        ])

        const authorName = user ? (user.name || user.email) : 'Неизвестный автор'

        const tracksWithAuthor = tracks.map(t => ({
            ...t,
            authorEmail: authorName
        }))

        res.json({ tracks: tracksWithAuthor })
    } catch (error) {
        console.error('[CRASH /api/tracks/my]:', error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
}

// 3. Создание трека с возможностью загрузить свой MP3 и обложку
export const createTrack = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id
        if (!userId) {
            return res.status(401).json({ message: 'Не удалось определить ID пользователя' })
        }

        const { title, artist } = req.body;
        const audioFile = req.files?.file?.[0];
        const coverFile = req.files?.cover?.[0];

        if (!title) {
            return res.status(400).json({ message: 'Название трека обязательно' })
        }

        let fileUrl = '';
        let isStreamed = true;

        if (audioFile) {
            fileUrl = await uploadToR2(audioFile, 'tracks');
            isStreamed = false;
        }

        let coverUrl = null;
        if (coverFile) {
            coverUrl = await uploadToR2(coverFile, 'track-covers');
        }

        const user = await User.findById(userId).select('email name').lean()

        const track = await Track.create({
            userId,
            title: title.trim(),
            artist: artist?.trim() || '',
            coverUrl,
            fileUrl,
            isSeed: false,
            isStreamed,
        })

        // BPM, тональность и волна считаются в фоне
        if (fileUrl) enqueueTrackProcessing(track._id)

        const trackWithAuthor = {
            ...track.toObject(),
            authorEmail: user ? (user.name || user.email) : ''
        }

        res.status(201).json({ track: trackWithAuthor })
    } catch (error) {
        console.error('[Create Track Error]:', error);
        res.status(500).json({ message: 'Ошибка при создании трека' });
    }
}

// 4. Универсальный стриминг аудио (файлы из R2 и YouTube через дисковый кэш)
export const streamTrackAudio = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' });
        }

        // ВАРИАНТ А: загруженный файл в R2
        if (isR2Track(track)) {
            try {
                const r2Response = await getFileStreamFromR2(track.fileUrl, req.headers.range);

                if (!r2Response || !r2Response.Body) {
                    return res.status(404).json({ message: 'Файл не найден в хранилище' });
                }

                const headers = {
                    'Content-Type': r2Response.ContentType || 'audio/mpeg',
                    'Accept-Ranges': 'bytes',
                };
                if (r2Response.ContentLength !== undefined) {
                    headers['Content-Length'] = r2Response.ContentLength;
                }
                if (r2Response.ContentRange) {
                    headers['Content-Range'] = r2Response.ContentRange;
                }

                res.writeHead(req.headers.range ? 206 : 200, headers);
                return r2Response.Body.pipe(res);
            } catch (r2Error) {
                console.error('[R2 Stream Error]:', r2Error);
                if (!res.headersSent) {
                    return res.status(500).json({ message: 'Ошибка при чтении файла из хранилища' });
                }
                return;
            }
        }

        // ВАРИАНТ Б: YouTube. Берём из кэша; если там нет, скачиваем один раз.
        // sendFile сам поддерживает Range, поэтому перемотка работает.
        const { file } = await ensureCached(track);

        res.setHeader('Content-Type', mimeForFile(file));
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.sendFile(file, (err) => {
            // обрыв соединения клиентом (перемотка, смена трека) не ошибка
            if (err && !res.headersSent && err.code !== 'ECONNABORTED') {
                res.status(500).json({ message: 'Ошибка отправки файла' });
            }
        });
    } catch (error) {
        console.error('[Stream Error]:', error);
        if (!res.headersSent) {
            res.status(502).json({ message: 'Не удалось получить аудио' });
        }
    }
};

// Подгрузка в кэш заранее (вызывается фронтом при наведении на кнопку Play)
export const prefetchTrackAudio = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' });
        }

        if (isR2Track(track)) {
            return res.status(204).end(); // свои файлы и так грузятся из R2
        }

        // Не ждём окончания: скачивание идёт в фоне
        ensureCached(track).catch((e) => console.error('[Prefetch Error]:', e.message));
        res.status(202).json({ status: 'queued' });
    } catch (error) {
        res.status(404).json({ message: 'Трек не найден' });
    }
};

// 5. Обновить название и исполнителя
export const updateTrackTitle = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id

        const updateData = {}
        if (req.body.title) updateData.title = req.body.title
        if (req.body.artist !== undefined) updateData.artist = req.body.artist

        const track = await Track.findOneAndUpdate(
            { _id: req.params.id, userId },
            updateData,
            { new: true }
        ).lean()

        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        const user = await User.findById(userId).select('email name').lean()
        const trackWithAuthor = {
            ...track,
            authorEmail: user ? (user.name || user.email) : ''
        }

        res.json({ track: trackWithAuthor })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка обновления трека' })
    }
}

// 6. Загрузить/заменить обложку
export const uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' })
        }

        const userId = req.userId || req.user?.id
        const track = await Track.findOne({ _id: req.params.id, userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.coverUrl && !track.coverUrl.startsWith('http')) {
            await deleteFromR2(track.coverUrl)
        }

        track.coverUrl = await uploadToR2(req.file, 'track-covers')
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при загрузке обложки' })
    }
}

// 7. Удалить обложку
export const deleteCover = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id
        const track = await Track.findOne({ _id: req.params.id, userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.coverUrl && !track.coverUrl.startsWith('http')) {
            await deleteFromR2(track.coverUrl)
        }

        track.coverUrl = null
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления обложки' })
    }
}

// 8. Заменить аудиофайл
export const updateTrackFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Аудиофайл не передан' })
        }

        const userId = req.userId || req.user?.id
        const track = await Track.findOne({ _id: req.params.id, userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.fileUrl && !track.fileUrl.startsWith('http')) {
            await deleteFromR2(track.fileUrl)
        }

        track.fileUrl = await uploadToR2(req.file, 'tracks')
        track.isStreamed = false
        await track.save()
        enqueueTrackProcessing(track._id)

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при обновлении аудиофайла' })
    }
}

// 9. Удалить трек целиком
export const deleteTrack = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id
        const track = await Track.findOne({ _id: req.params.id, userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        // deleteFromR2 сам игнорирует ссылки не из нашего хранилища, поэтому вызывать безопасно
        if (track.fileUrl) await deleteFromR2(track.fileUrl)
        if (track.coverUrl) await deleteFromR2(track.coverUrl)

        await track.deleteOne()
        res.json({ message: 'Удалено' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
}