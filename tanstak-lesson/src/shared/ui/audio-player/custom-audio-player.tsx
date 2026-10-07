import { useState, useRef, useEffect, type ChangeEvent, memo, useCallback } from "react";
import { AudioVisualizer } from "./audio-visualizer";
import { PlayIcon, PauseIcon, NextIcon, PrevIcon } from "@/shared/ui/icons/player-icons";
import { TrackLikeButton } from "@/features/tracks/ui/button/tracks-likes-button.tsx";
import { setGlow, resetGlow, vividRgb } from "@/shared/ui/lib/track-glow.ts";

export type RepeatMode = 'off' | 'all' | 'one';

type Props = {
    src: string;
    title?: string;
    artist?: string;
    coverSrc?: string | null;
    ambientColor?: string;
    autoPlay?: boolean;
    repeatMode?: RepeatMode;
    isPlaying?: boolean;
    onTogglePlay?: () => void;
    isShuffle?: boolean;
    isSeekable?: boolean;
    onTimeUpdate?: (time: number) => void;
    onToggleRepeat?: () => void;
    onToggleShuffle?: () => void;
    trackId?: string;
    onEnded?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onClose?: () => void;
    onExpand?: () => void;
    extraRightControls?: React.ReactNode;
};

const ShuffleIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
);

const RepeatIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const RepeatOneIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v6m-1-5l1-1" />
    </svg>
);

type ProgressBarProps = {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    duration: number;
    isSeekable: boolean;
    ambientColor: string;
    onTimeUpdate?: (time: number) => void;
    src: string;
};

const AudioProgressBar = memo(({
                                   audioRef,
                                   duration,
                                   isSeekable,
                                   ambientColor,
                                   onTimeUpdate,
                                   src
                               }: ProgressBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const currentTimeRef = useRef<HTMLSpanElement>(null);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    useEffect(() => {
        let rafId: number;

        const tick = () => {
            if (audioRef.current) {
                const time = audioRef.current.currentTime;

                if (inputRef.current) {
                    inputRef.current.value = String(time);
                    const dur = duration || 1;
                    const percent = (time / dur) * 100;
                    inputRef.current.style.background = `linear-gradient(to right, ${ambientColor} ${percent}%, rgba(255, 255, 255, 0.15) ${percent}%)`;
                }

                if (currentTimeRef.current) {
                    currentTimeRef.current.textContent = formatTime(time);
                }

                onTimeUpdate?.(time);
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [audioRef, duration, ambientColor, onTimeUpdate]);

    const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            onTimeUpdate?.(newTime);
            localStorage.setItem(`player-time-${src}`, String(newTime));
        }
    };

    return (
        <div className="flex flex-col w-full gap-1">
            <input
                ref={inputRef}
                type="range"
                min={0}
                max={duration || 100}
                defaultValue={0}
                disabled={!isSeekable}
                onChange={handleProgressChange}
                style={{
                    background: `linear-gradient(to right, ${ambientColor} 0%, rgba(255, 255, 255, 0.15) 0%)`,
                    '--thumb-color': ambientColor,
                } as React.CSSProperties}
                className={`w-full h-1.5 rounded-lg appearance-none focus:outline-none transition-all
                    ${!isSeekable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    disabled:opacity-40 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-[4px]
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:ring-2
                    [&::-webkit-slider-thumb]:ring-[var(--thumb-color)]
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:disabled:cursor-not-allowed
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-[4px]
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:ring-2
                    [&::-moz-range-thumb]:ring-[var(--thumb-color)]`}
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 font-medium px-0.5">
                <span ref={currentTimeRef}>0:00</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
});

AudioProgressBar.displayName = 'AudioProgressBar';

export const CustomAudioPlayer = ({
                                      src,
                                      title,
                                      artist,
                                      coverSrc,
                                      ambientColor = '#6366f1',
                                      autoPlay = true,
                                      repeatMode = 'off',
                                      isShuffle = false,
                                      isSeekable = true,
                                      onTimeUpdate,
                                      onToggleRepeat,
                                      onToggleShuffle,
                                      trackId,
                                      onEnded,
                                      onNext,
                                      onPrev,
                                      onClose,
                                      onExpand,
                                      extraRightControls
                                  }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [trackColor, setTrackColor] = useState(ambientColor);

    // Цвет из обложки
    useEffect(() => {
        if (!coverSrc) {
            queueMicrotask(() => setTrackColor(ambientColor));
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = coverSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 30;
            canvas.height = 30;
            ctx.drawImage(img, 0, 0, 30, 30);

            try {
                const data = ctx.getImageData(0, 0, 30, 30).data;
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < data.length; i += 16) {
                    const red = data[i]!;
                    const green = data[i + 1]!;
                    const blue = data[i + 2]!;
                    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

                    if (brightness > 30 && brightness < 220) {
                        r += red;
                        g += green;
                        b += blue;
                        count++;
                    }
                }

                if (count > 0) {
                    setTrackColor(`rgb(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)})`);
                } else {
                    setTrackColor(ambientColor);
                }
            } catch {
                setTrackColor(ambientColor);
            }
        };
        img.onerror = () => setTrackColor(ambientColor);
    }, [coverSrc, ambientColor]);

    // Публикуем цвет и состояние для свечения аватара в хедере
    useEffect(() => {
        setGlow({ rgb: vividRgb(trackColor).join(', ') });
    }, [trackColor]);

    useEffect(() => {
        setGlow({ playing: isPlaying });
    }, [isPlaying]);

    // Когда плеер закрыли, аватар возвращается к обычному виду
    useEffect(() => resetGlow, []);

    const [volume, setVolume] = useState<number>(() => {
        const saved = localStorage.getItem('player-volume');
        return saved !== null ? Number(saved) : 1;
    });

    const [isMuted, setIsMuted] = useState<boolean>(() => {
        return localStorage.getItem('player-muted') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('player-volume', String(volume));
        localStorage.setItem('player-muted', String(isMuted));
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Загрузка трека + автовоспроизведение (с ожиданием клика, если браузер заблокировал)
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !src) return;

        setIsBuffering(true);
        setDuration(0);

        const wasPlaying = localStorage.getItem('player-was-playing') !== 'false';
        let handleUserInteraction: (() => void) | null = null;

        const initAudio = () => {
            setDuration(audio.duration || 0);

            const savedTime = localStorage.getItem(`player-time-${src}`);
            if (savedTime && Number(savedTime) < audio.duration) {
                audio.currentTime = Number(savedTime);
            }

            if (wasPlaying || autoPlay) {
                audio.play()
                    .then(() => {
                        setIsPlaying(true);
                        setIsBuffering(false);
                        localStorage.setItem('player-was-playing', 'true');
                    })
                    .catch((err) => {
                        console.warn("Autoplay blocked:", err);
                        setIsPlaying(false);
                        setIsBuffering(false);

                        handleUserInteraction = () => {
                            audio.play().then(() => {
                                setIsPlaying(true);
                                localStorage.setItem('player-was-playing', 'true');
                            }).catch(() => {});

                            if (handleUserInteraction) {
                                window.removeEventListener('click', handleUserInteraction);
                                window.removeEventListener('keydown', handleUserInteraction);
                            }
                        };

                        window.addEventListener('click', handleUserInteraction, { once: true });
                        window.addEventListener('keydown', handleUserInteraction, { once: true });
                    });
            } else {
                setIsBuffering(false);
            }
        };

        if (audio.readyState >= 1) {
            initAudio();
        } else {
            audio.addEventListener('loadedmetadata', initAudio, { once: true });
        }

        return () => {
            audio.removeEventListener('loadedmetadata', initAudio);
            if (handleUserInteraction) {
                window.removeEventListener('click', handleUserInteraction);
                window.removeEventListener('keydown', handleUserInteraction);
            }
        };
    }, [src, autoPlay]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            localStorage.setItem('player-was-playing', 'false');
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                localStorage.setItem('player-was-playing', 'true');
            }).catch(console.error);
        }
    }, [isPlaying]);

    // Media Session: медиа-клавиши, наушники, экран блокировки
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || 'Музыкальный трек',
            artist: artist || 'My App',
            artwork: coverSrc ? [{ src: coverSrc }] : []
        });

        navigator.mediaSession.setActionHandler('play', () => {
            audioRef.current?.play().then(() => {
                setIsPlaying(true);
                localStorage.setItem('player-was-playing', 'true');
            });
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current?.pause();
            setIsPlaying(false);
            localStorage.setItem('player-was-playing', 'false');
        });

        navigator.mediaSession.setActionHandler('nexttrack', onNext ?? null);
        navigator.mediaSession.setActionHandler('previoustrack', onPrev ?? null);
    }, [title, artist, coverSrc, onNext, onPrev]);

    const handleEndedTrack = () => {
        if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
            return;
        }
        localStorage.removeItem(`player-time-${src}`);
        localStorage.setItem('player-was-playing', 'true');
        onEnded?.();
    };

    // Горячие клавиши
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    if (onNext) {
                        e.preventDefault();
                        onNext();
                    }
                    break;
                case 'ArrowLeft':
                    if (onPrev) {
                        e.preventDefault();
                        onPrev();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume((prev) => Number(Math.min(prev + 0.1, 1).toFixed(2)));
                    setIsMuted(false);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume((prev) => Number(Math.max(prev - 0.1, 0).toFixed(2)));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, togglePlay]);

    // Громкость: при движении ползунка снимаем mute
    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) setIsMuted(false);
    };

    const toggleMute = () => setIsMuted(!isMuted);

    const volumePercent = (isMuted ? 0 : volume) * 100;

    return (
        <div className="flex items-center justify-between w-full gap-2 md:gap-4 bg-transparent px-2 py-1">
            <audio
                ref={audioRef}
                src={src}
                crossOrigin="anonymous"
                onEnded={handleEndedTrack}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onSeeking={() => setIsBuffering(true)}
                onSeeked={() => setIsBuffering(false)}
                className="hidden"
            />

            {/* 1. Левая зона: обложка и текст (текст скрывается на мобильных) */}
            <div
                onClick={onExpand}
                className={`flex items-center gap-2.5 shrink-0 md:min-w-[240px] md:max-w-[300px] ${onExpand ? 'cursor-pointer group' : ''}`}
                title={onExpand ? "Развернуть во весь экран" : undefined}
            >
                {coverSrc ? (
                    <img
                        src={coverSrc}
                        alt={title || "Track"}
                        style={{ boxShadow: `0 6px 22px -4px ${trackColor}` }}
                        className={`w-9 h-9 md:w-12 md:h-12 rounded-lg object-cover shrink-0 transition-shadow duration-700 ${onExpand ? 'transition-transform duration-300 group-hover:scale-105' : ''}`}
                    />
                ) : (
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-500 text-xs md:text-sm">🎵</div>
                )}
                <div className="hidden md:flex flex-col min-w-0 flex-1">
                    <span className={`text-sm font-medium text-zinc-100 truncate ${onExpand ? 'group-hover:text-indigo-400 transition-colors' : ''}`}>
                        {title || "Без названия"}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                        {artist || "Неизвестный исполнитель"}
                    </span>
                </div>
            </div>

            {/* 2. Центр: кнопки и прогресс-бар */}
            <div className="flex flex-col items-center max-w-md w-full gap-1 flex-1 px-1">
                <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4">
                    {onToggleShuffle && (
                        <button
                            onClick={onToggleShuffle}
                            type="button"
                            className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 ${
                                isShuffle ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Случайный порядок"
                        >
                            <ShuffleIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    )}

                    {onPrev && (
                        <button
                            onClick={onPrev}
                            type="button"
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Предыдущий трек"
                        >
                            <PrevIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    )}

                    <button
                        onClick={togglePlay}
                        type="button"
                        disabled={isBuffering && !duration}
                        style={{ backgroundColor: trackColor }}
                        className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:opacity-90 disabled:opacity-70 text-white rounded-full transition-all shadow-md cursor-pointer shrink-0"
                        title={isPlaying ? "Пауза" : "Воспроизвести"}
                    >
                        {isBuffering ? (
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : isPlaying ? (
                            <PauseIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : (
                            <PlayIcon className="w-3.5 h-3.5 md:w-4 md:h-4 translate-x-[1px]" />
                        )}
                    </button>

                    {onNext && (
                        <button
                            onClick={onNext}
                            type="button"
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Следующий трек"
                        >
                            <NextIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    )}

                    {onToggleRepeat && (
                        <button
                            onClick={onToggleRepeat}
                            type="button"
                            className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer relative shrink-0 ${
                                repeatMode !== 'off' ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Повтор"
                        >
                            {repeatMode === 'one' ? <RepeatOneIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <RepeatIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                            {repeatMode === 'all' && <span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />}
                        </button>
                    )}

                    {trackId && <TrackLikeButton trackId={trackId} />}
                </div>

                <AudioProgressBar
                    audioRef={audioRef}
                    duration={duration}
                    isSeekable={isSeekable}
                    ambientColor={trackColor}
                    onTimeUpdate={onTimeUpdate}
                    src={src}
                />
            </div>

            {/* 3. Правая зона: визуализатор, громкость, доп. кнопки */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0 justify-end">
                <div className="hidden lg:flex">
                    <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} color={trackColor} />
                </div>

                <div className="hidden sm:flex items-center gap-2 w-28 md:w-36">
                    <button
                        onClick={toggleMute}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
                        title="Звук"
                    >
                        {isMuted || volume === 0 ? (
                            <svg className="w-8 h-5 fill-current" viewBox="0 0 16 16">
                                <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM10.707 5.293a.5.5 0 0 1 .707 0L13 6.707l1.586-1.414a.5.5 0 0 1 .708.707L13.707 7.5l1.587 1.586a.5.5 0 0 1-.708.708L13 8.207l-1.586 1.415a.5.5 0 0 1-.707-.708L12.293 7.5l-1.586-1.586a.5.5 0 0 1 0-.707z"/>
                            </svg>
                        ) : (
                            <svg className="w-8 h-5 fill-current" viewBox="0 0 16 16">
                                <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                                <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89l.706.706z"/>
                                <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                            </svg>
                        )}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        style={{
                            background: `linear-gradient(to right, ${trackColor} ${volumePercent}%, rgba(255, 255, 255, 0.15) ${volumePercent}%)`,
                            '--thumb-color': trackColor,
                        } as React.CSSProperties}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-none
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-2.5
                            [&::-webkit-slider-thumb]:h-2.5
                            [&::-webkit-slider-thumb]:rounded-[4px]
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:ring-2
                            [&::-webkit-slider-thumb]:ring-[var(--thumb-color)]
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-moz-range-thumb]:appearance-none
                            [&::-moz-range-thumb]:w-2.5
                            [&::-moz-range-thumb]:h-2.5
                            [&::-moz-range-thumb]:rounded-[4px]
                            [&::-moz-range-thumb]:bg-white
                            [&::-moz-range-thumb]:border-0
                            [&::-moz-range-thumb]:ring-2
                            [&::-moz-range-thumb]:ring-[var(--thumb-color)]"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 w-8 text-right select-none shrink-0">
                        {Math.round(volumePercent)}%
                    </span>
                </div>

                {extraRightControls}

                {onClose && (
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Закрыть"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};