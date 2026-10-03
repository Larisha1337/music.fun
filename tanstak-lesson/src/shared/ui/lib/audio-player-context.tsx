import { createContext, useContext, useState, type ReactNode } from 'react';

export type RepeatMode = 'off' | 'all' | 'one';

export type TrackInfo = {
    _id: string;
    id?: string;
    title: string;
    artist?: string;
    fileUrl: string;
    coverUrl?: string | null;
    authorEmail?: string;
};

type AudioPlayerContextType = {
    currentTrack: TrackInfo | null;
    playlist: TrackInfo[];
    repeatMode: RepeatMode;
    isShuffle: boolean;
    isFullscreen: boolean;
    isPlaying: boolean; // 👈 Добавили в тип
    playTrack: (track: TrackInfo, playlist?: TrackInfo[]) => void;
    togglePlay: () => void; // 👈 Добавили в тип
    playNext: () => void;
    playPrev: () => void;
    toggleRepeatMode: () => void;
    toggleShuffle: () => void;
    toggleFullscreen: () => void;
    closePlayer: () => void;
};

// Хелпер нормализации данных трека
const normalizeTrack = (track: TrackInfo): TrackInfo => {
    let displayTitle = track.title;
    let displayArtist = track.artist?.trim();

    if (!displayArtist) {
        const separator = track.title.includes(' — ')
            ? ' — '
            : track.title.includes(' - ')
                ? ' - '
                : null;

        if (separator) {
            const parts = track.title.split(separator);
            const pTitle = parts[0]?.trim();
            const pArtist = parts[1]?.trim();

            if (pTitle) displayTitle = pTitle;
            if (pArtist) displayArtist = pArtist;
        }
    }

    return {
        ...track,
        title: displayTitle,
        artist: displayArtist || track.authorEmail || 'Неизвестный исполнитель'
    };
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(() => {
        const savedTrack = localStorage.getItem('player-current-track');
        return savedTrack ? normalizeTrack(JSON.parse(savedTrack)) : null;
    });

    const [playlist, setPlaylist] = useState<TrackInfo[]>(() => {
        const savedPlaylist = localStorage.getItem('player-playlist');
        if (!savedPlaylist) return [];
        const parsed: TrackInfo[] = JSON.parse(savedPlaylist);
        return parsed.map(normalizeTrack);
    });

    // 💡 Стейт воспроизведения (с восстановлением из localStorage)
    const [isPlaying, setIsPlaying] = useState<boolean>(() => {
        return localStorage.getItem('player-was-playing') === 'true';
    });

    const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
        const savedMode = localStorage.getItem('player-repeat-mode');
        return (savedMode as RepeatMode) || 'off';
    });

    const [isShuffle, setIsShuffle] = useState<boolean>(() => {
        return localStorage.getItem('player-shuffle') === 'true';
    });

    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const toggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    const toggleRepeatMode = () => {
        setRepeatMode((prev) => {
            const next: RepeatMode = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
            localStorage.setItem('player-repeat-mode', next);
            return next;
        });
    };

    const toggleShuffle = () => {
        setIsShuffle((prev) => {
            const next = !prev;
            localStorage.setItem('player-shuffle', String(next));
            return next;
        });
    };

    // 💡 Переключение Play/Pause
    const togglePlay = () => {
        setIsPlaying((prev) => {
            const next = !prev;
            localStorage.setItem('player-was-playing', String(next));
            return next;
        });
    };

    const playTrack = (track: TrackInfo, newPlaylist?: TrackInfo[]) => {
        const formattedTrack = normalizeTrack(track);
        setCurrentTrack(formattedTrack);
        localStorage.setItem('player-current-track', JSON.stringify(formattedTrack));

        setIsPlaying(true);
        localStorage.setItem('player-was-playing', 'true');

        if (newPlaylist) {
            const formattedPlaylist = newPlaylist.map(normalizeTrack);
            setPlaylist(formattedPlaylist);
            localStorage.setItem('player-playlist', JSON.stringify(formattedPlaylist));
        }
    };

    // Переход к следующему треку
    const playNext = () => {
        if (!currentTrack || playlist.length === 0) return;

        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);
        let nextTrack: TrackInfo | undefined;

        if (isShuffle && playlist.length > 1) {
            let randomIndex = currentIndex;
            while (randomIndex === currentIndex) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
            nextTrack = playlist[randomIndex];
        } else {
            const nextIndex = (currentIndex + 1) % playlist.length;
            nextTrack = playlist[nextIndex];
        }

        if (nextTrack) {
            const formattedNext = normalizeTrack(nextTrack);
            setCurrentTrack(formattedNext);
            localStorage.setItem('player-current-track', JSON.stringify(formattedNext));
            setIsPlaying(true);
            localStorage.setItem('player-was-playing', 'true');
        }
    };

    // Переход к предыдущему треку
    const playPrev = () => {
        if (!currentTrack || playlist.length === 0) return;

        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);
        let prevTrack: TrackInfo | undefined;

        if (isShuffle && playlist.length > 1) {
            let randomIndex = currentIndex;
            while (randomIndex === currentIndex) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
            prevTrack = playlist[randomIndex];
        } else {
            const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
            prevTrack = playlist[prevIndex];
        }

        if (prevTrack) {
            const formattedPrev = normalizeTrack(prevTrack);
            setCurrentTrack(formattedPrev);
            localStorage.setItem('player-current-track', JSON.stringify(formattedPrev));
            setIsPlaying(true);
            localStorage.setItem('player-was-playing', 'true');
        }
    };

    const closePlayer = () => {
        setCurrentTrack(null);
        setPlaylist([]);
        setIsPlaying(false);
        localStorage.removeItem('player-current-track');
        localStorage.removeItem('player-playlist');
        localStorage.removeItem('player-was-playing');
    };

    return (
        <AudioPlayerContext.Provider
            value={{
                currentTrack,
                playlist,
                repeatMode,
                isShuffle,
                isFullscreen,
                isPlaying,
                playTrack,
                togglePlay,
                playNext,
                playPrev,
                toggleRepeatMode,
                toggleShuffle,
                toggleFullscreen,
                closePlayer,
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    );
};

export const useAudioPlayer = () => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
    }
    return context;
};