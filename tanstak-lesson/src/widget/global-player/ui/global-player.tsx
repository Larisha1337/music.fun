import React, { useState, useEffect, useMemo } from "react";
import { useAudioPlayer } from "@/shared/ui/lib/audio-player-context";
import { CustomAudioPlayer } from "@/shared/ui/audio-player/custom-audio-player";
import { useCoverColor } from "@/shared/ui/lib/use-cover-color";
import { usePictureInPicture } from "@/shared/ui/lib/use-picture-in-picture";
import { LyricsView } from "@/shared/ui/lib/parce/lyrics-view";
import { parseLrc } from "@/shared/ui/lib/parce/lrc-parser";
import { fetchLyrics } from "@/shared/api/lyrics-api";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || "http://localhost:5000";

const getMediaUrl = (url?: string | null): string | null => {
    if (!url) return null;
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `${MY_API_BASE}${url}`;
};

const FullscreenLyricsBox = ({ track }: { track: { _id: string; title: string; artist?: string } }) => {
    const [lrcString, setLrcString] = useState("");
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const lyrics = useMemo(() => {
        return lrcString ? parseLrc(lrcString) : [];
    }, [lrcString]);

    useEffect(() => {
        if (!track) return;
        let isCancelled = false;

        setIsLoadingLyrics(true);
        fetchLyrics(track.title, track.artist)
            .then((lrc) => {
                if (!isCancelled) setLrcString(lrc || "");
            })
            .finally(() => {
                if (!isCancelled) setIsLoadingLyrics(false);
            });

        return () => {
            isCancelled = true;
        };
    }, [track._id, track.title, track.artist]);

    useEffect(() => {
        const audioEl = document.querySelector('audio');
        if (!audioEl) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audioEl.currentTime);
        };

        audioEl.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            audioEl.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, []);

    return (
        <div className="w-full lg:w-1/2 h-[45vh] lg:h-[60vh] flex flex-col items-center justify-center bg-black/40 rounded-3xl p-6 sm:p-8 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden min-h-0">
            {isLoadingLyrics ? (
                <div className="text-center text-zinc-300 animate-pulse text-lg font-medium my-auto">
                    Загрузка текста...
                </div>
            ) : lyrics.length > 0 ? (
                <div className="w-full h-full overflow-y-auto flex flex-col justify-center">
                    <LyricsView
                        lyrics={lyrics}
                        currentTime={currentTime}
                        offset={0.3}
                    />
                </div>
            ) : (
                <div className="text-center text-zinc-400 text-lg font-medium my-auto">
                    Для этого трека пока нет текста
                </div>
            )}
        </div>
    );
};

const MemoizedCustomAudioPlayer = React.memo((props: any) => {
    return <CustomAudioPlayer {...props} />;
}, (prevProps, nextProps) => {
    return (
        prevProps.trackId === nextProps.trackId &&
        prevProps.isPlaying === nextProps.isPlaying &&
        prevProps.repeatMode === nextProps.repeatMode &&
        prevProps.isShuffle === nextProps.isShuffle &&
        prevProps.src === nextProps.src
    );
});

export const GlobalPlayer = () => {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        playNext,
        playPrev,
        closePlayer,
        repeatMode,
        isShuffle,
        toggleRepeatMode,
        toggleShuffle,
        isFullscreen,
        toggleFullscreen
    } = useAudioPlayer();

    const { isPipOpen, isSupported, togglePip, renderPip } = usePictureInPicture();

    const coverSrc = getMediaUrl(currentTrack?.coverUrl);
    const ambientColor = useCoverColor(coverSrc, "#6366f1");

    useEffect(() => {
        if (!isFullscreen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") toggleFullscreen();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen, toggleFullscreen]);

    if (!currentTrack) return null;

    const isExternalUrl = (url?: string | null) =>
        !url || url.trim() === "" || /googlevideo\.com|youtube\.com|dzcdn\.net/.test(url);

    const hasCustomFile = !isExternalUrl(currentTrack?.fileUrl);
    const audioSrc = hasCustomFile
        ? getMediaUrl(currentTrack.fileUrl)!
        : `${MY_API_BASE}/api/tracks/${currentTrack._id}/stream`;
    const isSeekable = hasCustomFile;

    // Кнопка режима PiP
    const pipButton = isSupported ? (
        <button
            onClick={togglePip}
            title="Вынести плеер поверх всех окон"
            aria-label="Вынести плеер поверх всех окон"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        </button>
    ) : null;

    return (
        <>
            {!isPipOpen && (
                <div
                    className={
                        isFullscreen
                            ? "fixed inset-0 w-screen h-screen z-[9999] bg-[#09090b]/85 backdrop-blur-3xl flex flex-col items-center justify-between p-6 sm:p-10 text-white overflow-hidden transition-all duration-300"
                            : "fixed bottom-0 left-0 right-0 z-[100] bg-[#18181b]/75 backdrop-blur-xl border-t border-white/15 px-4 py-3 flex flex-col transition-all duration-300"
                    }
                >
                    {/* Фоновое свечение */}
                    <div
                        className={
                            isFullscreen
                                ? "absolute inset-0 -z-10 blur-[140px] opacity-70 pointer-events-none transition-colors duration-700"
                                : "absolute inset-0 -z-10 blur-3xl opacity-75 pointer-events-none scale-y-125 transition-colors duration-700"
                        }
                        style={{ backgroundColor: ambientColor }}
                    />

                    {/* Полноэкранный режим */}
                    {isFullscreen && (
                        <>
                            <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
                                        Сейчас играет
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer shadow-lg text-lg"
                                    title="Свернуть (Esc)"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 my-auto z-10 py-2 min-h-0">
                                <div className="flex flex-col items-center justify-center text-center gap-6 w-full lg:w-1/2">
                                    <div
                                        className="w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 shrink-0 transition-transform duration-500 hover:scale-[1.02]"
                                        style={{ boxShadow: `0 35px 90px -15px ${ambientColor}` }}
                                    >
                                        {coverSrc ? (
                                            <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">🎵</div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 max-w-md px-4">
                                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white truncate">
                                            {currentTrack.title}
                                        </h2>
                                        <p className="text-base sm:text-lg text-zinc-300 font-medium truncate">
                                            {currentTrack.artist || "Неизвестный исполнитель"}
                                        </p>
                                    </div>
                                </div>

                                <FullscreenLyricsBox track={currentTrack} />
                            </div>
                        </>
                    )}

                    {/* Плеер (в нижней панели или внизу фуллскрина) */}
                    <div className="w-full flex items-center">
                        <MemoizedCustomAudioPlayer
                            src={audioSrc}
                            title={currentTrack.title}
                            artist={currentTrack.artist}
                            coverSrc={coverSrc}
                            ambientColor={ambientColor}
                            isSeekable={isSeekable}
                            repeatMode={repeatMode}
                            isShuffle={isShuffle}
                            onToggleRepeat={toggleRepeatMode}
                            onToggleShuffle={toggleShuffle}
                            trackId={currentTrack._id}
                            onNext={playNext}
                            onPrev={playPrev}
                            onEnded={playNext}
                            isPlaying={isPlaying}
                            onTogglePlay={togglePlay}
                            autoPlay
                            onClose={closePlayer}
                            onExpand={toggleFullscreen}
                            extraRightControls={pipButton}
                        />
                    </div>
                </div>
            )}

            {/* Режим Picture-in-Picture */}
            {isPipOpen &&
                renderPip(
                    <div className="relative h-full w-full bg-zinc-950/90 backdrop-blur-2xl text-white p-4 flex flex-col justify-between select-none font-sans overflow-hidden border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <div
                            className="absolute -inset-10 -z-10 blur-[60px] opacity-60 pointer-events-none transition-colors duration-700 scale-125"
                            style={{ backgroundColor: ambientColor }}
                        />

                        <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                                    Mini Player
                                </span>
                            </div>
                            <button
                                onClick={togglePip}
                                title="Вернуть в главное окно"
                                className="group flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                                <span>Вернуть</span>
                                <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 z-10 my-auto">
                            <div
                                className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/20 shadow-xl relative group"
                                style={{ boxShadow: `0 10px 30px -5px ${ambientColor}` }}
                            >
                                {coverSrc ? (
                                    <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>
                                )}

                                {isPlaying && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="flex items-end gap-0.5 h-4">
                                            <span className="w-1 bg-indigo-400 animate-bounce h-full rounded-full" />
                                            <span className="w-1 bg-indigo-400 animate-bounce h-2/3 rounded-full [animation-delay:0.2s]" />
                                            <span className="w-1 bg-indigo-400 animate-bounce h-4/5 rounded-full [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                                <h4 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight">
                                    {currentTrack.title}
                                </h4>
                                <p className="text-xs text-zinc-300 font-medium truncate">
                                    {currentTrack.artist || "Неизвестный исполнитель"}
                                </p>
                            </div>
                        </div>

                        <div className="z-10 w-full pt-1">
                            <MemoizedCustomAudioPlayer
                                src={audioSrc}
                                title={currentTrack.title}
                                artist={currentTrack.artist}
                                coverSrc={coverSrc}
                                ambientColor={ambientColor}
                                isSeekable={isSeekable}
                                repeatMode={repeatMode}
                                isShuffle={isShuffle}
                                onToggleRepeat={toggleRepeatMode}
                                onToggleShuffle={toggleShuffle}
                                trackId={currentTrack._id}
                                onNext={playNext}
                                onPrev={playPrev}
                                onEnded={playNext}
                                isPlaying={isPlaying}
                                onTogglePlay={togglePlay}
                                autoPlay
                            />
                        </div>
                    </div>
                )}
        </>
    );
};