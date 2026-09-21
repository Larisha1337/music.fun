import { createContext, useContext, useState, type ReactNode } from 'react';

export type TrackInfo = {
    _id: string;
    id?: string;
    title: string;
    artist: string;
    fileUrl: string;
    coverUrl?: string | null;
};

type AudioPlayerContextType = {
    currentTrack: TrackInfo | null;
    playlist: TrackInfo[];
    playTrack: (track: TrackInfo, playlist?: TrackInfo[]) => void;
    playNext: () => void;
    playPrev: () => void;
    closePlayer: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
    // 1. Восстанавливаем текущий трек из localStorage
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(() => {
        const savedTrack = localStorage.getItem('player-current-track');
        return savedTrack ? JSON.parse(savedTrack) : null;
    });

    // 2. Восстанавливаем плейлист из localStorage (чтобы переключение работает и после F5)
    const [playlist, setPlaylist] = useState<TrackInfo[]>(() => {
        const savedPlaylist = localStorage.getItem('player-playlist');
        return savedPlaylist ? JSON.parse(savedPlaylist) : [];
    });

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
        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
            const nextTrack = playlist[currentIndex + 1];
            if (nextTrack) {
                setCurrentTrack(nextTrack);
                localStorage.setItem('player-current-track', JSON.stringify(nextTrack));
            }
        } else {
            // Зацикливаем на первый трек
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
        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        if (currentIndex > 0) {
            const prevTrack = playlist[currentIndex - 1];
            if (prevTrack) {
                setCurrentTrack(prevTrack);
                localStorage.setItem('player-current-track', JSON.stringify(prevTrack));
            }
        } else {
            // Переходим на самый последний трек в списке
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
        <AudioPlayerContext.Provider value={{ currentTrack, playlist, playTrack, playNext, playPrev, closePlayer }}>
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