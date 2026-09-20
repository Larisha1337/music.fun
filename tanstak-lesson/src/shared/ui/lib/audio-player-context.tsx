import { createContext, useContext, useState, type ReactNode } from 'react';

export type TrackInfo = {
    _id: string;
    title: string;
    fileUrl: string;
    coverUrl?: string | null | undefined;
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
    const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
    const [playlist, setPlaylist] = useState<TrackInfo[]>([]);

    const playTrack = (track: TrackInfo, newPlaylist?: TrackInfo[]) => {
        setCurrentTrack(track);
        if (newPlaylist) {
            setPlaylist(newPlaylist);
        }
    };

    // Переход к следующему треку
    const playNext = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
            const nextTrack = playlist[currentIndex + 1];
            if (nextTrack) setCurrentTrack(nextTrack);
        } else {
            // Если дошли до конца, зацикливаем на первый трек
            const firstTrack = playlist[0];
            if (firstTrack) setCurrentTrack(firstTrack);
        }
    };

    // Переход к предыдущему треку
    const playPrev = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);

        if (currentIndex > 0) {
            const prevTrack = playlist[currentIndex - 1];
            if (prevTrack) setCurrentTrack(prevTrack);
        } else {
            // Если это первый трек, переходим на самый последний в списке
            const lastTrack = playlist[playlist.length - 1];
            if (lastTrack) setCurrentTrack(lastTrack);
        }
    };

    const closePlayer = () => {
        setCurrentTrack(null);
        setPlaylist([]);
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