import youtubedl from 'yt-dlp-exec';

/**
 * 1. Ищем трек в Deezer (для получения обложки, альбома и правильного названия)
 */
export const findTrackInDeezer = async (title, artist) => {
    try {
        const query = `${artist} ${title}`;
        const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.data || data.data.length === 0) return null;

        const track = data.data[0];
        return {
            title: track.title,
            artist: track.artist.name,
            album: track.album.title,
            duration_ms: track.duration * 1000,
            coverUrl: track.album.cover_medium || track.artist.picture_medium || null
        };
    } catch (error) {
        console.error('[MusicFinder] Ошибка поиска в Deezer:', error);
        return null;
    }
};

/**
 * 2. Получаем живую прямую ссылку на ПОЛНЫЙ аудиопоток через yt-dlp-exec
 */
export const getYoutubeAudioStreamUrl = async (searchQuery) => {
    try {
        // yt-dlp-exec выполняет поиск и возвращает прямую ссылку (-g) на лучший аудиопоток (-f bestaudio)
        const result = await youtubedl.exec(`ytsearch1:${searchQuery}`, {
            g: true,
            f: 'bestaudio'
        });

        const streamUrl = result.stdout.trim().split('\n')[0];

        if (!streamUrl) {
            throw new Error('yt-dlp не смог извлечь ссылку на поток');
        }

        return streamUrl;
    } catch (error) {
        console.error('[MusicFinder] Ошибка yt-dlp:', error.message);
        throw error;
    }
};

/**
 * 3. Связка: Deezer (метаданные) -> yt-dlp (полный трек)
 */
export const findAndStreamTrack = async (title, artist) => {
    let metadata = await findTrackInDeezer(title, artist);

    if (!metadata) {
        metadata = { title, artist, coverUrl: null, duration_ms: 180000 };
    }

    const youtubeQuery = `${metadata.artist} - ${metadata.title} Audio`;
    const streamUrl = await getYoutubeAudioStreamUrl(youtubeQuery);

    return {
        ...metadata,
        fileUrl: streamUrl
    };
};