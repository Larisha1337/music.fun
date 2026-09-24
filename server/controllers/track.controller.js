import Track from '../models/Track.js'
import User from '../models/User.js'
import { uploadToR2, deleteFromR2 } from '../service/r2.js'

// 1. Глобальная лента (с авторами)
export const getAllTracks = async (req, res) => {
    try {
        const tracks = await Track.find().sort({ createdAt: -1 }).lean()

        const userIds = [...new Set(
            tracks
                .filter(t => t.userId && t.userId !== 'system')
                .map(t => t.userId.toString())
        )]

        const users = await User.find({ _id: { $in: userIds } }).select('email name').lean()

        const authorById = Object.fromEntries(
            users.map(u => [u._id.toString(), u.name || u.email])
        )

        const tracksWithAuthor = tracks.map(t => ({
            ...t,
            authorEmail: t.userId && authorById[t.userId.toString()]
                ? authorById[t.userId.toString()]
                : 'Deezer / Chart'
        }))

        res.json({ tracks: tracksWithAuthor })
    } catch (error) {
        console.error('[Error GET /api/tracks]:', error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
}

// 2. Мои треки (теперь тоже с authorEmail)
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
            User.findById(userId).select('email name').lean() // 👈 Достаем автора
        ])

        const authorName = user ? (user.name || user.email) : 'Неизвестный автор'

        const tracksWithAuthor = tracks.map(t => ({
            ...t,
            authorEmail: authorName // 👈 Добавляем authorEmail во все треки
        }))

        res.json({ tracks: tracksWithAuthor })
    } catch (error) {
        console.error('[CRASH /api/tracks/my]:', error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
}

// 3. Загрузить новый трек
export const createTrack = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' })
        }

        const userId = req.userId || req.user?.id
        if (!userId) {
            return res.status(401).json({ message: 'Не удалось определить ID пользователя' })
        }

        const user = await User.findById(userId).select('email name').lean()
        const fileUrl = await uploadToR2(req.file, 'tracks')

        const track = await Track.create({
            userId,
            title: req.body.title || req.file.originalname,
            artist: req.body.artist || '',
            fileUrl,
            fileSize: req.file.size,
            isSeed: false
        })

        const trackWithAuthor = {
            ...track.toObject(),
            authorEmail: user ? (user.name || user.email) : '' // 👈 Возвращаем authorEmail сразу клиенту
        }

        console.log(`[Track Created] Трек "${track.title}" (${track.artist}) загружен в R2 пользователем ${userId}`)

        res.status(201).json({ track: trackWithAuthor })
    } catch (error) {
        console.error('[Create Track Error]:', error)
        res.status(500).json({ message: 'Ошибка при загрузке трека' })
    }
}

// 4. Обновить название и исполнителя
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

// 5. Загрузить/заменить обложку
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

        if (track.coverUrl) {
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

// 6. Удалить обложку
export const deleteCover = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id
        const track = await Track.findOne({ _id: req.params.id, userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.coverUrl) {
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

// 7. Заменить аудиофайл
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

        if (track.fileUrl) {
            await deleteFromR2(track.fileUrl)
        }

        track.fileUrl = await uploadToR2(req.file, 'tracks')
        track.fileSize = req.file.size
        await track.save()

        res.json({ track })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при обновлении аудиофайла' })
    }
}

// 8. Удалить трек целиком
export const deleteTrack = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id
        const track = await Track.findOne({ _id: req.params.id, userId })
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        if (track.fileUrl) await deleteFromR2(track.fileUrl)
        if (track.coverUrl) await deleteFromR2(track.coverUrl)

        await track.deleteOne()
        res.json({ message: 'Удалено' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
}