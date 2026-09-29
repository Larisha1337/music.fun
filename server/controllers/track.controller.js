import Track from '../models/Track.js'
import User from '../models/User.js'
import { uploadToR2, deleteFromR2, getFileStreamFromR2 } from '../service/r2.js'
import youtubedl from 'yt-dlp-exec'

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

        // Если пользователь прикрепил свой MP3 файл
        if (audioFile) {
            fileUrl = await uploadToR2(audioFile, 'tracks');
            isStreamed = false; // Это локальный файл, стримить через yt-dlp не нужно!
        } else {
            // Если файл не прикрепили, это трек для стриминга по названию
            isStreamed = true;
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
            album: 'Uploaded Album',
            duration: 180, // Можно вычислять или передавать
            coverUrl,
            fileUrl, // Здесь будет ссылка на R2 или пустая строка для стрима
            isSeed: false,
            isStreamed,
        })

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

// 4. Универсальный стриминг аудио (для файлов из R2 и YouTube)
export const streamTrackAudio = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            return res.status(404).json({ message: 'Трек не найден' });
        }

        // ВАРИАНТ А: У трека есть загруженный файл в R2
        if (track.fileUrl && track.fileUrl.trim() !== '') {
            console.log(`[Stream] Стриминг файла из R2 для трека: "${track.title}"`);

            try {
                const r2Response = await getFileStreamFromR2(track.fileUrl, req.headers.range);

                if (r2Response && r2Response.Body) {
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

                    // Если браузер запросил кусок (Range), отдаем 206, иначе 200
                    const statusCode = req.headers.range ? 206 : 200;
                    res.writeHead(statusCode, headers);

                    return r2Response.Body.pipe(res);
                }
            } catch (r2Error) {
                console.error('[R2 Stream Error]:', r2Error);
                if (!res.headersSent) {
                    return res.status(500).json({ message: 'Ошибка при чтении файла из хранилища' });
                }
            }
        }

        // ВАРИАНТ Б: Стриминг с YouTube через yt-dlp
        const searchQuery = track.artist
            ? `${track.artist} - ${track.title} official audio`
            : `${track.title} song`;

        console.log(`[Stream] Генерация YouTube потока для: "${searchQuery}"`);

        // 🌟 Обязательные заголовки, чтобы поток не обрывался на 30-й секунде
        res.setHeader('Content-Type', 'audio/webm');
        res.setHeader('Accept-Ranges', 'none'); // Говорим браузеру, что перемотки здесь нет
        res.setHeader('Transfer-Encoding', 'chunked');

        const subprocess = youtubedl.exec(
            `ytsearch1:${searchQuery}`,
            {
                f: 'bestaudio',
                o: '-',
                q: true,
                noCheckCertificates: true
            },
            { stdio: ['ignore', 'pipe', 'ignore'] }
        );

        subprocess.stdout.pipe(res);

        subprocess.on('error', (err) => {
            console.error('[Stream] Ошибка yt-dlp:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Ошибка воспроизведения потока' });
            }
        });

        req.on('close', () => {
            subprocess.kill();
        });

    } catch (error) {
        console.error('[Stream Error]:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
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

        if (!track.isStreamed) {
            if (track.fileUrl) await deleteFromR2(track.fileUrl)
            if (track.coverUrl && !track.coverUrl.startsWith('http')) {
                await deleteFromR2(track.coverUrl)
            }
        }

        await track.deleteOne()
        res.json({ message: 'Удалено' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка удаления трека' })
    }
}

