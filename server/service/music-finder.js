/**
 * Ищем трек в Deezer (обложка, правильное название)
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
 * Метаданные для трека. Аудио НЕ ищем: оно стримится через /api/tracks/:id/stream
 * в момент воспроизведения (ссылки YouTube протухают и привязаны к IP).
 */
export const findAndStreamTrack = async (title, artist) => {
    const metadata = await findTrackInDeezer(title, artist);

    return {
        ...(metadata || { title, artist, coverUrl: null, duration_ms: 180000 }),
        fileUrl: ''
    };
};