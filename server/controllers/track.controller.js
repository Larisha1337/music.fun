import fs from 'fs'
import path from 'path'
import Track from '../models/Track.js'
import User from '../models/User.js'

// 1. Глобальная лента (с автоочисткой и авторами)
export const getAllTracks = async (req, res) => {
    try {
        const tracks = await Track.find().sort({ createdAt: -1 }).lean()
        const validTracks = []

        for (const track of tracks) {
            if (!track.fileUrl) {
                await Track.deleteOne({ _id: track._id })
                continue
            }

            const cleanRelativePath = track.fileUrl.replace(/^\//, '')
            const filePath = path.join(process.cwd(), cleanRelativePath)

            if (fs.existsSync(filePath)) {
                if (track.coverUrl) {
                    const cleanCoverPath = track.coverUrl.replace(/^\//, '')
                    const coverPath = path.join(process.cwd(), cleanCoverPath)
                    if (!fs.existsSync(coverPath)) {
                        await Track.updateOne({ _id: track._id }, { coverUrl: null })
                        track.coverUrl = null
                    }
                }
                validTracks.push(track)
            } else {
                await Track.deleteOne({ _id: track._id })
                console.log(`[Auto-Clean] Удален битый трек из БД: ${track.title}`)
            }
        }

        const userIds = [...new Set(
            validTracks
                .filter(t => t.userId && t.userId !== 'system')
                .map(t => t.userId.toString())
        )]

        const users = await User.find({ _id: { $in: userIds } }).select('email').lean()
        const emailById = Object.fromEntries(users.map(u => [u._id.toString(), u.email]))

        const tracksWithAuthor = validTracks.map(t => ({
            ...t,
            authorEmail: t.userId && emailById[t.userId.toString()]
                ? emailById[t.userId.toString()]
                : 'Deezer / Chart'
        }))

        res.json({ tracks: tracksWithAuthor })
    } catch (error) {
        console.error('[Error GET /api/tracks]:', error)
        res.status(500).json({ message: 'Ошибка получения треков' })
    }
}

// 2. Мои треки (только пользователя, без isSeed: true)
export const getMyTracks = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id

        if (!userId) {
            return res.status(401).json({ message: 'Неавторизован: ID пользователя не найден' })
        }

        const tracks = await Track.find({
            userId: userId,
            isSeed: { $ne: true }
        }).sort({ createdAt: -1 }).lean()

        const validTracks = []

        for (const track of tracks) {
            if (!track.fileUrl) {
                await Track.deleteOne({ _id: track._id })
                continue
            }

            const cleanRelativePath = track.fileUrl.replace(/^\//, '')
            const filePath = path.join(process.cwd(), cleanRelativePath)

            if (fs.existsSync(filePath)) {
                if (track.coverUrl) {
                    const cleanCoverPath = track.coverUrl.replace(/^\//, '')
                    const coverPath = path.join(process.cwd(), cleanCoverPath)
                    if (!fs.existsSync(coverPath)) {
                        await Track.updateOne({ _id: track._id }, { coverUrl: null })
                        track.coverUrl = null
                    }
                }
                validTracks.push(track)
            } else {
                console.warn(`[Auto-Clean] Файл не найден на диске: ${filePath}`)
                await Track.deleteOne({ _id: track._id })
            }
        }

        res.json({ tracks: validTracks })
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

        const fileUrl = `/uploads/tracks/${req.file.filename}`

        const track = await Track.create({
            userId,
            title: req.body.title || req.file.originalname,
            fileUrl,
            fileSize: req.file.size,
            isSeed: false
        })

        console.log(`[Track Created] Трек "${track.title}" успешно загружен пользователем ${userId}`)

        res.status(201).json({ track })
    } catch (error) {
        console.error('[Create Track Error]:', error)
        res.status(500).json({ message: 'Ошибка при загрузке трека' })
    }
}

// 4. Обновить название
export const updateTrackTitle = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id
        const track = await Track.findOneAndUpdate(
            { _id: req.params.id, userId },
            { title: req.body.title },
            { new: true }
        )

        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' })
        }

        res.json({ track })
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
            const cleanCoverPath = track.coverUrl.replace(/^\//, '')
            const oldPath = path.join(process.cwd(), cleanCoverPath)
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        track.coverUrl = `/uploads/track-covers/${req.file.filename}`
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
            const cleanCoverPath = track.coverUrl.replace(/^\//, '')
            const filePath = path.join(process.cwd(), cleanCoverPath)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
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
            const cleanFilePath = track.fileUrl.replace(/^\//, '')
            const oldPath = path.join(process.cwd(), cleanFilePath)
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        track.fileUrl = `/uploads/tracks/${req.file.filename}`
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

        if (track.fileUrl) {
            const cleanFilePath = track.fileUrl.replace(/^\//, '')
            const filePath = path.join(process.cwd(), cleanFilePath)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }

        if (track.coverUrl) {
            const cleanCoverPath = track.coverUrl.replace(/^\//, '')
            const coverPath = path.join(process.cwd(), cleanCoverPath)
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath)
        }

        await track.deleteOne()
        res.json({ message: 'Удалено' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
}