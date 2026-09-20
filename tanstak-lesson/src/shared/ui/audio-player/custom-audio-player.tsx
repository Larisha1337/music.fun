import { useState, useRef, useEffect, type ChangeEvent } from "react";

type Props = {
    src: string;
    autoPlay?: boolean;
    onEnded?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
};

export const CustomAudioPlayer = ({ src, autoPlay, onEnded, onNext, onPrev }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay || false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (autoPlay && src && audioRef.current) {
            setIsPlaying(true);
            audioRef.current.play().catch(e => console.log("Play interrupted:", e));
        }
    }, [src, autoPlay]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
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

    return (
        <div className="flex items-center gap-3 sm:gap-4 w-full bg-transparent">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={onEnded}
                className="hidden"
            />

            {/* Блок кнопок управления (Назад, Play/Pause, Вперед) */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Кнопка Предыдущий трек */}
                {onPrev && (
                    <button
                        onClick={onPrev}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Предыдущий трек"
                    >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                            <path d="M12.5 3.5a.5.5 0 0 0-.8-.4l-6 4.5a.5.5 0 0 0 0 .8l6 4.5a.5.5 0 0 0 .8-.4V3.5zM3.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 1 .5-.5z"/>
                        </svg>
                    </button>
                )}

                {/* Кнопка Play/Pause */}
                <button
                    onClick={togglePlay}
                    type="button"
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors shrink-0 shadow-md cursor-pointer"
                >
                    {isPlaying ? (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                            <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 fill-current translate-x-[1px]" viewBox="0 0 16 16">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                        </svg>
                    )}
                </button>

                {/* Кнопка Следующий трек */}
                {onNext && (
                    <button
                        onClick={onNext}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Следующий трек"
                    >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                            <path d="M3.5 3.5a.5.5 0 0 1 .8-.4l6 4.5a.5.5 0 0 1 0 .8l-6 4.5a.5.5 0 0 1-.8-.4V3.5zM12.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 1 .5-.5z"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Прогресс-бар и время */}
            <div className="flex flex-col flex-1 gap-1">
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none"
                />
                <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 font-medium px-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Управление громкостью */}
            <div className="hidden sm:flex items-center gap-2 w-24 shrink-0">
                <button
                    onClick={toggleMute}
                    className="text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none cursor-pointer"
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
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-300 hover:accent-white focus:outline-none"
                />
            </div>
        </div>
    );
};