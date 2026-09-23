import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { AudioVisualizer } from "./audio-visualizer";
import { PlayIcon, PauseIcon, NextIcon, PrevIcon } from "@/shared/ui/icons/player-icons";

type Props = {
    src: string;
    title?: string;
    coverSrc?: string | null;
    ambientColor?: string;
    autoPlay?: boolean;
    onEnded?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
};

export const CustomAudioPlayer = ({
                                      src,
                                      title,
                                      coverSrc,
                                      ambientColor = '#6366f1',
                                      autoPlay = true,
                                      onEnded,
                                      onNext,
                                      onPrev
                                  }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const [volume, setVolume] = useState<number>(() => {
        const savedVolume = localStorage.getItem('player-volume');
        return savedVolume !== null ? Number(savedVolume) : 1;
    });

    const [isMuted, setIsMuted] = useState<boolean>(() => {
        return localStorage.getItem('player-muted') === 'true';
    });

    // Синхронизация громкости
    useEffect(() => {
        localStorage.setItem('player-volume', String(volume));
        localStorage.setItem('player-muted', String(isMuted));

        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Инициализация и запуск
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !src) return;

        setIsBuffering(true);
        setCurrentTime(0);
        setDuration(0);

        const wasPlaying = localStorage.getItem('player-was-playing') !== 'false';

        let handleUserInteraction: (() => void) | null = null;

        const initAudio = () => {
            setDuration(audio.duration || 0);

            const savedTime = localStorage.getItem(`player-time-${src}`);
            if (savedTime && Number(savedTime) < audio.duration) {
                audio.currentTime = Number(savedTime);
                setCurrentTime(Number(savedTime));
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

    // Интеграция с Media Session API
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

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);
            localStorage.setItem(`player-time-${src}`, String(time));
        }
    };

    const handleEndedTrack = () => {
        localStorage.removeItem(`player-time-${src}`);
        localStorage.setItem('player-was-playing', 'true');
        if (onEnded) onEnded();
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
    }, [isPlaying, onNext, onPrev]);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) setIsMuted(false);
    };

    const toggleMute = () => setIsMuted(!isMuted);

    const progressPercent = (currentTime / (duration || 1)) * 100;
    const volumePercent = (isMuted ? 0 : volume) * 100;

    return (
        <div className="flex items-center gap-3 sm:gap-4 w-full bg-transparent">
            <audio
                ref={audioRef}
                src={src}
                crossOrigin="anonymous" // 👈 КЛЮЧЕВАЯ СТРОКА ДЛЯ РАБОТЫ R2 С CANVAS/AUDIOVISUALIZER
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEndedTrack}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onSeeking={() => setIsBuffering(true)}
                onSeeked={() => setIsBuffering(false)}
                className="hidden"
            />

            {/* Элементы управления треком */}
            <div className="flex items-center gap-2 shrink-0">
                {onPrev && (
                    <button
                        onClick={onPrev}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Предыдущий трек"
                        aria-label="Предыдущий трек"
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
                    aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
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
                        aria-label="Следующий трек"
                    >
                        <NextIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Прогресс-бар и тайминги */}
            <div className="flex flex-col flex-1 gap-1">
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleProgressChange}
                    style={{
                        background: `linear-gradient(to right, ${ambientColor} ${progressPercent}%, #3f3f46 ${progressPercent}%)`
                    }}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none transition-all"
                />
                <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 font-medium px-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Аудио-визуалайзер */}
            <div className="hidden md:flex items-center shrink-0">
                <AudioVisualizer
                    audioRef={audioRef}
                    isPlaying={isPlaying}
                    color={ambientColor}
                />
            </div>

            {/* Громкость */}
            <div className="hidden sm:flex items-center gap-2 w-24 shrink-0">
                <button
                    onClick={toggleMute}
                    className="text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none cursor-pointer"
                    title={isMuted ? "Включить звук" : "Выключить звук"}
                    aria-label={isMuted ? "Включить звук" : "Выключить звук"}
                >
                    {isMuted || volume === 0 ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
                            <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM10.707 5.293a.5.5 0 0 1 .707 0L13 6.707l1.586-1.414a.5.5 0 0 1 .708.707L13.707 7.5l1.587 1.586a.5.5 0 0 1-.708.708L13 8.207l-1.586 1.415a.5.5 0 0 1-.707-.708L12.293 7.5l-1.586-1.586a.5.5 0 0 1 0-.707z"/>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
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
                        background: `linear-gradient(to right, #d4d4d8 ${volumePercent}%, #3f3f46 ${volumePercent}%)`
                    }}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-zinc-300 hover:accent-white focus:outline-none transition-all"
                />
            </div>
        </div>
    );
};