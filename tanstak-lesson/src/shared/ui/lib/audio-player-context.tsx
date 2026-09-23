import { createContext, useContext, useState, type ReactNode } from 'react';

export type RepeatMode = 'off' | 'all' | 'one';

export type TrackInfo = {
    _id: string;
    id?: string;
    title: string;
    artist?: string;
    fileUrl: string;
    coverUrl?: string | null;
};

type AudioPlayerContextType = {
    currentTrack: TrackInfo | null;
    playlist: TrackInfo[];
    repeatMode: RepeatMode;
    isShuffle: boolean;
    playTrack: (track: TrackInfo, playlist?: TrackInfo[]) => void;
    playNext: () => void;
    playPrev: () => void;
    toggleRepeatMode: () => void;
    toggleShuffle: () => void;
    closePlayer: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
    // 1. Восстанавливаем текущий трек из localStorage
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(() => {
        const savedTrack = localStorage.getItem('player-current-track');
        return savedTrack ? JSON.parse(savedTrack) : null;
    });

    // 2. Восстанавливаем плейлист из localStorage
    const [playlist, setPlaylist] = useState<TrackInfo[]>(() => {
        const savedPlaylist = localStorage.getItem('player-playlist');
        return savedPlaylist ? JSON.parse(savedPlaylist) : [];
    });

    // 3. Восстанавливаем режим повтора из localStorage
    const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
        const savedMode = localStorage.getItem('player-repeat-mode');
        return (savedMode as RepeatMode) || 'off';
    });

    // 4. Восстанавливаем режим перемешивания из localStorage
    const [isShuffle, setIsShuffle] = useState<boolean>(() => {
        return localStorage.getItem('player-shuffle') === 'true';
    });

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

    const playTrack = (track: TrackInfo, newPlaylist?: TrackInfo[]) => {
        setCurrentTrack(track);
        localStorage.setItem('player-current-track', JSON.stringify(track));

        if (newPlaylist) {
            setPlaylist(newPlaylist);
            localStorage.setItem('player-playlist', JSON.stringify(newPlaylist));
        }
    };

    // Переход к следующему треку
    const playNext = () => {
        if (!currentTrack || playlist.length === 0) return;

        // Если включен перемешанный порядок (Shuffle)
        if (isShuffle && playlist.length > 1) {
            const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);
            let randomIndex = currentIndex;

            // Выбираем случайный трек, отличный от текущего
            while (randomIndex === currentIndex) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }

            const nextTrack = playlist[randomIndex];
            if (nextTrack) {
                setCurrentTrack(nextTrack);
                localStorage.setItem('player-current-track', JSON.stringify(nextTrack));
            }
            return;
        }

        // Обычный порядок воспроизведения
        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
            const nextTrack = playlist[currentIndex + 1];
            if (nextTrack) {
                setCurrentTrack(nextTrack);
                localStorage.setItem('player-current-track', JSON.stringify(nextTrack));
            }
        } else if (repeatMode === 'all') {
            // Переходим к первому треку только если включен повтор всего плейлиста ('all')
            const firstTrack = playlist[0];
            if (firstTrack) {
                setCurrentTrack(firstTrack);
                localStorage.setItem('player-current-track', JSON.stringify(firstTrack));
            }
        }
    };

    // Переход к предыдущему треку
    const playPrev = () => {
        if (!currentTrack || playlist.length === 0) return;

        if (isShuffle && playlist.length > 1) {
            const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);
            let randomIndex = currentIndex;

            while (randomIndex === currentIndex) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }

            const prevTrack = playlist[randomIndex];
            if (prevTrack) {
                setCurrentTrack(prevTrack);
                localStorage.setItem('player-current-track', JSON.stringify(prevTrack));
            }
            return;
        }

        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        if (currentIndex > 0) {
            const prevTrack = playlist[currentIndex - 1];
            if (prevTrack) {
                setCurrentTrack(prevTrack);
                localStorage.setItem('player-current-track', JSON.stringify(prevTrack));
            }
        } else if (repeatMode === 'all') {
            const lastTrack = playlist[playlist.length - 1];
            if (lastTrack) {
                setCurrentTrack(lastTrack);
                localStorage.setItem('player-current-track', JSON.stringify(lastTrack));
            }
        }
    };

    const closePlayer = () => {
        setCurrentTrack(null);
        setPlaylist([]);
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
                playTrack,
                playNext,
                playPrev,
                toggleRepeatMode,
                toggleShuffle,
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