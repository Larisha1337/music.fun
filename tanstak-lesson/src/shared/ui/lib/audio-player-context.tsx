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
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(() => {
        const savedTrack = localStorage.getItem('player-current-track');
        return savedTrack ? JSON.parse(savedTrack) : null;
    });

    const [playlist, setPlaylist] = useState<TrackInfo[]>(() => {
        const savedPlaylist = localStorage.getItem('player-playlist');
        return savedPlaylist ? JSON.parse(savedPlaylist) : [];
    });

    const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
        const savedMode = localStorage.getItem('player-repeat-mode');
        return (savedMode as RepeatMode) || 'off';
    });

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

    // Переход к следующему треку (с зацикливанием с последнего на первый)
    const playNext = () => {
        if (!currentTrack || playlist.length === 0) return;

        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        // Режим случайного воспроизведения
        if (isShuffle && playlist.length > 1) {
            let randomIndex = currentIndex;
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

        // Если это последний трек (currentIndex === playlist.length - 1), переходим на 0 (первый)
        const nextIndex = (currentIndex + 1) % playlist.length;
        const nextTrack = playlist[nextIndex];

        if (nextTrack) {
            setCurrentTrack(nextTrack);
            localStorage.setItem('player-current-track', JSON.stringify(nextTrack));
        }
    };

    // Переход к предыдущему треку (с зацикливанием с первого на последний)
    const playPrev = () => {
        if (!currentTrack || playlist.length === 0) return;

        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        // Режим случайного воспроизведения
        if (isShuffle && playlist.length > 1) {
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

        // Если это первый трек (currentIndex <= 0), переходим на последний (playlist.length - 1)
        const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
        const prevTrack = playlist[prevIndex];

        if (prevTrack) {
            setCurrentTrack(prevTrack);
            localStorage.setItem('player-current-track', JSON.stringify(prevTrack));
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