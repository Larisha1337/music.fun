import { useState, useRef, useEffect, type ChangeEvent, memo } from "react";
import { AudioVisualizer } from "./audio-visualizer";
import { PlayIcon, PauseIcon, NextIcon, PrevIcon } from "@/shared/ui/icons/player-icons";
import { TrackLikeButton } from "@/features/tracks/ui/button/tracks-likes-button.tsx";

export type RepeatMode = 'off' | 'all' | 'one';

type Props = {
    src: string;
    title?: string;
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

// Прогресс-бар на рефах: 0 ререндеров React при воспроизведении 60 FPS
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

                // Напрямую обновляем value и стили инпута без ререндера React
                if (inputRef.current) {
                    inputRef.current.value = String(time);
                    const dur = duration || 1;
                    const percent = (time / dur) * 100;
                    inputRef.current.style.background = `linear-gradient(to right, ${ambientColor} ${percent}%, #3f3f46 ${percent}%)`;
                }

                // Напрямую обновляем текстовый спан времени
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
        <div className="flex flex-col w-full gap-2">
            <input
                ref={inputRef}
                type="range"
                min={0}
                max={duration || 100}
                defaultValue={0}
                disabled={!isSeekable}
                onChange={handleProgressChange}
                style={{
                    ["--thumb-color" as any]: ambientColor,
                }}
                className={`w-full h-1.5 rounded-lg appearance-none focus:outline-none transition-all
                    ${!isSeekable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    disabled:opacity-40 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3.5
                    [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-[4px]
                    [&::-webkit-slider-thumb]:bg-[var(--thumb-color)]
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:disabled:cursor-not-allowed
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-3.5
                    [&::-moz-range-thumb]:h-3.5
                    [&::-moz-range-thumb]:rounded-[4px]
                    [&::-moz-range-thumb]:bg-[var(--thumb-color)]
                    [&::-moz-range-thumb]:border-0`}
            />
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 font-medium px-0.5">
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
                                      onPrev
                                  }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);

    const [volume, setVolume] = useState<number>(() => {
        const savedVolume = localStorage.getItem('player-volume');
        return savedVolume !== null ? Number(savedVolume) : 1;
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

    const togglePlay = () => {
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
    };

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || 'Музыкальный трек',
            artist: 'My App',
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

        if (onNext) {
            navigator.mediaSession.setActionHandler('nexttrack', onNext);
        } else {
            navigator.mediaSession.setActionHandler('nexttrack', null);
        }

        if (onPrev) {
            navigator.mediaSession.setActionHandler('previoustrack', onPrev);
        } else {
            navigator.mediaSession.setActionHandler('previoustrack', null);
        }
    }, [title, coverSrc, onNext, onPrev]);

    const handleEndedTrack = () => {
        if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
            return;
        }

        localStorage.removeItem(`player-time-${src}`);
        localStorage.setItem('player-was-playing', 'true');
        if (onEnded) onEnded();
    };

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
    }, [isPlaying, onNext, onPrev]);

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) setIsMuted(false);
    };

    const toggleMute = () => setIsMuted(!isMuted);

    const volumePercent = (isMuted ? 0 : volume) * 100;

    return (
        <div className="flex flex-col w-full gap-1 bg-transparent">
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

            {/* 1. Изолированный прогресс-бар на рефах */}
            <AudioProgressBar
                audioRef={audioRef}
                duration={duration}
                isSeekable={isSeekable}
                ambientColor={ambientColor}
                onTimeUpdate={onTimeUpdate}
                src={src}
            />

            {/* 2. Нижняя панель управления */}
            <div className="flex items-center justify-between w-full">
                <div className="hidden md:flex items-center shrink-0">
                    <AudioVisualizer
                        audioRef={audioRef}
                        isPlaying={isPlaying}
                        color={ambientColor}
                    />
                </div>

                {/* Центр: кнопки */}
                <div className="flex items-center justify-center gap-3 sm:gap-6 flex-1">
                    {onToggleShuffle && (
                        <button
                            onClick={onToggleShuffle}
                            type="button"
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                isShuffle ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Случайный порядок"
                        >
                            <ShuffleIcon className="w-4 h-4" />
                        </button>
                    )}

                    {onPrev && (
                        <button
                            onClick={onPrev}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Предыдущий трек"
                        >
                            <PrevIcon className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={togglePlay}
                        type="button"
                        disabled={isBuffering && !duration}
                        className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/70 text-white rounded-full transition-all shrink-0 shadow-md cursor-pointer"
                        title={isPlaying ? "Пауза" : "Воспроизвести"}
                    >
                        {isBuffering ? (
                            <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : isPlaying ? (
                            <PauseIcon className="w-4 h-4" />
                        ) : (
                            <PlayIcon className="w-4 h-4 translate-x-[1px]" />
                        )}
                    </button>

                    {onNext && (
                        <button
                            onClick={onNext}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Следующий трек"
                        >
                            <NextIcon className="w-4 h-4" />
                        </button>
                    )}

                    {onToggleRepeat && (
                        <button
                            onClick={onToggleRepeat}
                            type="button"
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer relative ${
                                repeatMode !== 'off' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Повтор"
                        >
                            {repeatMode === 'one' ? (
                                <RepeatOneIcon className="w-4 h-4" />
                            ) : (
                                <RepeatIcon className="w-4 h-4" />
                            )}
                            {repeatMode === 'all' && (
                                <span className="absolute bottom-1.5 w-1 h-1 bg-indigo-400 rounded-full" />
                            )}
                        </button>
                    )}

                    {trackId && (
                        <div className="flex items-center shrink-0">
                            <TrackLikeButton trackId={trackId} />
                        </div>
                    )}
                </div>

                {/* Правая часть: Громкость */}
                <div className="hidden sm:flex items-center gap-2 w-30 shrink-0 justify-end">
                    <button
                        onClick={toggleMute}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none cursor-pointer"
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
                            background: `linear-gradient(to right, #d4d4d8 ${volumePercent}%, #3f3f46 ${volumePercent}%)`,
                            ["--thumb-color" as any]: ambientColor,
                        }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3.5
                            [&::-webkit-slider-thumb]:h-3.5
                            [&::-webkit-slider-thumb]:rounded-[4px]
                            [&::-webkit-slider-thumb]:bg-[var(--thumb-color)]
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-moz-range-thumb]:appearance-none
                            [&::-moz-range-thumb]:w-3.5
                            [&::-moz-range-thumb]:h-3.5
                            [&::-moz-range-thumb]:rounded-[4px]
                            [&::-moz-range-thumb]:bg-[var(--thumb-color)]
                            [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 w-8 text-right select-none">
                        {Math.round(volumePercent)}%
                    </span>
                </div>
            </div>
        </div>
    );
};