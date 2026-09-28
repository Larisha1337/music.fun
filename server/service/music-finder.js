// src/service/music-finder.js
import { Innertube } from 'youtubei.js';

let youtubeClient = null;

const initialize = async () => {
    try {
        if (!youtubeClient) {
            // 👈 Правильная инициализация Innertube
            youtubeClient = await Innertube.create();
        }
    } catch (error) {
        console.error('[MusicFinder] Ошибка инициализации YouTube клиента:', error);
    }
};

/**
 * 1. Ищем трек в Deezer (бесплатно, без ключей)
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
 * 2. Получаем прямую ссылку на аудиопоток с YouTube через Innertube
 */
export const getYoutubeAudioStreamUrl = async (searchQuery) => {
    await initialize();

    if (!youtubeClient) {
        throw new Error('YouTube клиент не инициализирован');
    }

    try {
        const searchResults = await youtubeClient.search(searchQuery, { type: 'video' });
        if (!searchResults.videos || searchResults.videos.length === 0) {
            throw new Error('Видео не найдено на YouTube');
        }

        const video = searchResults.videos[0];
        console.log(`[MusicFinder] Нашел видео: "${video.title?.text || video.title}" (${video.id})`);

        const videoInfo = await youtubeClient.getBasicInfo(video.id);

        const audioFormat = videoInfo.streaming_data?.formats
            .filter(f => f.mime_type?.includes('audio') && !f.mime_type?.includes('video'))
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

        if (!audioFormat) {
            throw new Error('Не удалось найти аудиопоток для этого видео');
        }

        if (audioFormat.url) {
            return audioFormat.url;
        } else {
            const nsig = videoInfo.player_config?.signature_timestamp
                ? await youtubeClient.session.player.decryptNSignature(
                    audioFormat.signature_cipher || audioFormat.cipher,
                    videoInfo.player_config.signature_timestamp
                )
                : null;

            const url = new URL(audioFormat.signature_cipher || audioFormat.cipher);
            url.searchParams.set('alr', 'yes');
            if (nsig) url.searchParams.set('n', nsig);

            return url.toString();
        }
    } catch (error) {
        console.error('[MusicFinder] Ошибка получения аудио с YouTube:', error);
        throw error;
    }
};

/**
 * 3. Связка: Deezer (метаданные) -> YouTube (аудио)
 */
export const findAndStreamTrack = async (title, artist) => {
    let metadata = await findTrackInDeezer(title, artist);

    if (!metadata) {
        metadata = { title, artist, coverUrl: null };
    }

    const youtubeQuery = `${metadata.artist} - ${metadata.title} (Audio)`;
    const streamUrl = await getYoutubeAudioStreamUrl(youtubeQuery);

    return {
        ...metadata,
        fileUrl: streamUrl
    };
};