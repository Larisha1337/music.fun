import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAudioPlayer } from "@/shared/ui/lib/audio-player-context";
import { CustomAudioPlayer } from "@/shared/ui/audio-player/custom-audio-player";
import { useCoverColor } from "@/shared/ui/lib/use-cover-color";
import { usePictureInPicture } from "@/shared/ui/lib/use-picture-in-picture";
import { LyricsView } from "@/shared/ui/lib/parce/lyrics-view";
import { parseLrc } from "@/shared/ui/lib/parce/lrc-parser";
import { fetchLyrics } from "@/shared/api/lyrics-api";
import { subscribeBeat } from "@/shared/ui/lib/track-glow.ts";
import { SimilarTracksPanel } from "@/features/tracks/ui/similar-tracks-panel.tsx";
import { usePlayHistory } from "@/features/tracks/api/use-play-history.ts";
import { QueuePanel } from "@/shared/ui/audio-player/queue-panel";
import { usePreloadNext } from "@/shared/ui/lib/use-preload-next";
import { TrimModal } from "@/features/tracks/ui/trim/trim-modal.tsx";
import { useTrim, clearTrim } from "@/shared/ui/lib/trim-store.ts";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || "http://localhost:5000";

const getMediaUrl = (url?: string | null): string | null => {
    if (!url) return null;
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `${MY_API_BASE}${url}`;
};

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Трек играет через сервер (YouTube-кэш), если у него нет собственного файла
const isStreamedUrl = (url?: string | null) =>
    !url || url.trim() === "" || /googlevideo\.com|youtube\.com|dzcdn\.net/.test(url);

const audioSrcFor = (track: { _id: string; fileUrl?: string | null }) =>
    isStreamedUrl(track.fileUrl)
        ? `${MY_API_BASE}/api/tracks/${track._id}/stream`
        : getMediaUrl(track.fileUrl)!;

const formatClock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/* ---------- Обложка / вращающаяся виниловая пластинка ---------- */

type SpinningCoverProps = {
    src: string | null;
    alt: string;
    color: string;
    playing: boolean;
    vinyl: boolean;
    onToggle: () => void;
};

const SpinningCover = ({ src, alt, color, playing, vinyl, onToggle }: SpinningCoverProps) => {
    const wrapRef = useRef<HTMLButtonElement>(null);
    const discRef = useRef<HTMLDivElement>(null);
    const spinRef = useRef<Animation | null>(null);

    // Вращение диска (Web Animations API: работает без CSS-файлов)
    useEffect(() => {
        const el = discRef.current;
        if (!el || typeof el.animate !== "function") return;

        const spin = el.animate(
            [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
            { duration: 14000, iterations: Infinity }
        );
        spin.pause();
        spinRef.current = spin;
        return () => spin.cancel();
    }, []);

    // Крутится только в режиме винила и пока играет музыка
    useEffect(() => {
        const spin = spinRef.current;
        if (!spin) return;

        if (vinyl && playing && !prefersReducedMotion()) spin.play();
        else spin.pause();

        if (!vinyl) spin.currentTime = 0;
    }, [vinyl, playing]);

    // Плавное появление при смене трека
    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;

        el.animate(
            [
                { opacity: 0, transform: "scale(0.9)" },
                { opacity: 1, transform: "scale(1)" },
            ],
            { duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
        );
    }, [src]);

    // Удар в бас: обложка слегка «подпрыгивает», диск на ударах крутится быстрее
    useEffect(() => {
        const el = wrapRef.current;
        if (!el || !playing || prefersReducedMotion()) return;

        const off = subscribeBeat((level) => {
            el.style.transform = `scale(${1 + level * 0.035})`;
            const spin = spinRef.current;
            if (spin && vinyl) spin.playbackRate = 1 + level * 1.5;
        });

        return () => {
            off();
            el.style.transform = "";
            if (spinRef.current) spinRef.current.playbackRate = 1;
        };
    }, [playing, vinyl]);

    const fade = { opacity: vinyl ? 1 : 0, transition: "opacity 0.6s ease" };

    return (
        <button
            ref={wrapRef}
            type="button"
            onClick={onToggle}
            aria-label={vinyl ? "Показать обложку" : "Режим винила"}
            title={vinyl ? "Показать обложку" : "Режим винила"}
            className="relative block w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 shrink-0 overflow-hidden border border-white/15 bg-zinc-900 cursor-pointer p-0"
            style={{
                borderRadius: vinyl ? "50%" : "24px",
                boxShadow: `0 35px 90px -15px ${color}`,
                transition: "border-radius 0.6s ease, box-shadow 0.7s ease",
            }}
        >
            <div ref={discRef} className="absolute inset-0">
                {src ? (
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🎵</div>
                )}

                {/* Бороздки пластинки */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        ...fade,
                        background:
                            "repeating-radial-gradient(circle at center, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.16) 4px)",
                    }}
                />

                {/* Центральное отверстие */}
                <div
                    className="absolute left-1/2 top-1/2 w-[16%] h-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950 ring-4 ring-black/40 pointer-events-none"
                    style={fade}
                >
                    <span className="absolute inset-[36%] rounded-full bg-zinc-700" />
                </div>
            </div>

            {/* Блик на пластинке: стоит на месте, пока диск вращается под ним */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    ...fade,
                    background:
                        "conic-gradient(from 20deg, transparent 0deg, rgba(255,255,255,0.14) 40deg, transparent 80deg, transparent 180deg, rgba(255,255,255,0.14) 220deg, transparent 260deg)",
                }}
            />
        </button>
    );
};

/* ---------- Плавающие цветные пятна на фоне полноэкранного режима ---------- */

const AmbientBlobs = ({ color }: { color: string }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root || typeof root.animate !== "function" || prefersReducedMotion()) return;

        const animations = Array.from(root.children).map((child, i) =>
            (child as HTMLElement).animate(
                [
                    { transform: "translate(0, 0) scale(1)" },
                    {
                        transform: `translate(${i % 2 ? "-" : ""}${12 + i * 6}vw, ${i === 1 ? "-" : ""}${10 + i * 5}vh) scale(${1.15 + i * 0.1})`,
                    },
                    { transform: "translate(0, 0) scale(1)" },
                ],
                { duration: 16000 + i * 5000, iterations: Infinity, easing: "ease-in-out" }
            )
        );

        return () => animations.forEach((a) => a.cancel());
    }, []);

    // Фон вспыхивает и чуть «раздувается» на ударах
    useEffect(() => {
        const root = rootRef.current;
        if (!root || prefersReducedMotion()) return;

        const off = subscribeBeat((level) => {
            root.style.opacity = String(0.75 + level * 0.25);
            root.style.transform = `scale(${1 + level * 0.05})`;
        });

        return () => {
            off();
            root.style.opacity = "";
            root.style.transform = "";
        };
    }, []);

    return (
        <div ref={rootRef} className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-[15%] -left-[10%] w-[60vmin] h-[60vmin] rounded-full blur-3xl opacity-50 transition-colors duration-1000"
                style={{ backgroundColor: color }}
            />
            <div
                className="absolute -bottom-[20%] -right-[10%] w-[70vmin] h-[70vmin] rounded-full blur-3xl opacity-40 transition-colors duration-1000"
                style={{ backgroundColor: color }}
            />
            <div
                className="absolute top-[35%] left-[40%] w-[45vmin] h-[45vmin] rounded-full blur-3xl opacity-30 transition-colors duration-1000"
                style={{ backgroundColor: color }}
            />
        </div>
    );
};

/* ---------- Текст песни ---------- */

type LyricsBoxProps = {
    track: { _id: string; title: string; artist?: string };
    seekable: boolean;
};

// Компонент пересоздаётся при смене трека (key={track._id} снаружи),
// поэтому сбрасывать состояние внутри эффекта не нужно
const FullscreenLyricsBox = ({ track, seekable }: LyricsBoxProps) => {
    const [lrcString, setLrcString] = useState("");
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    const lyrics = useMemo(() => (lrcString ? parseLrc(lrcString) : []), [lrcString]);

    useEffect(() => {
        let isCancelled = false;

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
    }, [track.title, track.artist]);

    useEffect(() => {
        const audioEl = document.querySelector("audio");
        if (!audioEl) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audioEl.currentTime);
        };

        audioEl.addEventListener("timeupdate", handleTimeUpdate);
        return () => {
            audioEl.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, []);

    // Клик по строке перематывает трек (только для загруженных файлов: у YouTube-потока перемотки нет)
    const handleLineClick = useCallback((time: number) => {
        const audioEl = document.querySelector("audio");
        if (!audioEl) return;
        audioEl.currentTime = time;
        setCurrentTime(time);
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-black/40 rounded-3xl p-2 sm:p-4 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden min-h-0">
            {isLoadingLyrics ? (
                <div className="text-center text-zinc-300 animate-pulse text-lg font-medium my-auto">
                    Загрузка текста...
                </div>
            ) : lyrics.length > 0 ? (
                <LyricsView
                    lyrics={lyrics}
                    currentTime={currentTime}
                    offset={0.3}
                    onLineClick={seekable ? handleLineClick : undefined}
                />
            ) : (
                <div className="text-center text-zinc-400 text-lg font-medium my-auto">
                    Для этого трека пока нет текста
                </div>
            )}
        </div>
    );
};

/* ---------- Правая панель полноэкранного режима: текст песни или похожие треки ---------- */

type SideTab = "lyrics" | "similar";

const FullscreenSidePanel = ({ track, seekable }: LyricsBoxProps) => {
    const [tab, setTab] = useState<SideTab>("lyrics");

    const tabs: { id: SideTab; label: string }[] = [
        { id: "lyrics", label: "Текст" },
        { id: "similar", label: "Похожие" },
    ];

    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-3 min-h-0">
            <div
                role="tablist"
                className="flex self-center gap-1 p-1 rounded-full bg-black/30 border border-white/10 backdrop-blur-xl"
            >
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            tab === t.id ? "bg-white/20 text-white" : "text-zinc-300 hover:text-white"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="h-[40vh] lg:h-[55vh] min-h-0">
                {tab === "lyrics" ? (
                    <FullscreenLyricsBox key={track._id} track={track} seekable={seekable} />
                ) : (
                    <SimilarTracksPanel trackId={track._id} />
                )}
            </div>
        </div>
    );
};

type PlayerProps = React.ComponentProps<typeof CustomAudioPlayer>;

// onExpand в сравнении нужен, чтобы кнопка и клавиша F в плеере не работали со «старым» состоянием полноэкранного режима
const MemoizedCustomAudioPlayer = React.memo(
    (props: PlayerProps) => <CustomAudioPlayer {...props} />,
    (prev, next) =>
        prev.trackId === next.trackId &&
        prev.isPlaying === next.isPlaying &&
        prev.repeatMode === next.repeatMode &&
        prev.isShuffle === next.isShuffle &&
        prev.src === next.src &&
        prev.onExpand === next.onExpand &&
        prev.trim === next.trim
);

export const GlobalPlayer = () => {
    const {
        currentTrack,
        playlist,
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
        toggleFullscreen,
    } = useAudioPlayer();

    const { isPipOpen, isSupported, togglePip, renderPip } = usePictureInPicture();

    const coverSrc = getMediaUrl(currentTrack?.coverUrl);
    const ambientColor = useCoverColor(coverSrc, "#f95c9e");
    const [queueOpen, setQueueOpen] = useState(false);
    const [trimOpen, setTrimOpen] = useState(false);

    const trim = useTrim();
    const activeTrim = currentTrack && trim?.trackId === currentTrack._id ? trim : null;

    // Обрезка действует только для того трека, для которого её задали
    useEffect(() => {
        if (trim && trim.trackId !== currentTrack?._id) clearTrim();
    }, [trim, currentTrack?._id]);

    // Следующий трек очереди готовим заранее. При shuffle он выбирается случайно в момент перехода, поэтому тогда не знаем
    const nextTrack = useMemo(() => {
        if (!currentTrack || isShuffle || repeatMode === "one" || playlist.length < 2) return null;
        const i = playlist.findIndex((t) => t._id === currentTrack._id);
        return i < 0 ? null : playlist[(i + 1) % playlist.length] ?? null;
    }, [currentTrack, playlist, isShuffle, repeatMode]);

    usePreloadNext(
        nextTrack
            ? { id: nextTrack._id, src: audioSrcFor(nextTrack), streamed: isStreamedUrl(nextTrack.fileUrl) }
            : null
    );
    // Засчитываем прослушивание, когда трек играл 20 секунд
    usePlayHistory(currentTrack?._id);

    // Режим винила запоминается между сессиями
    const [vinyl, setVinyl] = useState(() => localStorage.getItem("player-vinyl") === "true");
    useEffect(() => {
        localStorage.setItem("player-vinyl", String(vinyl));
    }, [vinyl]);

    // Свайп вниз закрывает полноэкранный режим (телефон)
    const fsRef = useRef<HTMLDivElement>(null);
    const swipeRef = useRef({ startY: 0, dy: 0, active: false });

    const onSwipeStart = (e: React.TouchEvent) => {
        swipeRef.current = { startY: e.touches[0]?.clientY ?? 0, dy: 0, active: true };
        if (fsRef.current) fsRef.current.style.transition = "none";
    };

    const onSwipeMove = (e: React.TouchEvent) => {
        const s = swipeRef.current;
        const el = fsRef.current;
        if (!s.active || !el) return;

        s.dy = Math.max(0, (e.touches[0]?.clientY ?? 0) - s.startY);
        el.style.transform = `translateY(${s.dy}px)`;
        el.style.opacity = String(Math.max(0.4, 1 - s.dy / 600));
    };

    const onSwipeEnd = () => {
        const s = swipeRef.current;
        const el = fsRef.current;
        if (!s.active || !el) return;
        s.active = false;

        if (s.dy > 120) {
            toggleFullscreen();
            el.style.transition = "";
            el.style.transform = "";
            el.style.opacity = "";
        } else {
            el.style.transition = "transform 0.25s ease, opacity 0.25s ease";
            el.style.transform = "";
            el.style.opacity = "";
            window.setTimeout(() => {
                if (fsRef.current) fsRef.current.style.transition = "";
            }, 260);
        }
    };

    const swipeHandlers = {
        onTouchStart: onSwipeStart,
        onTouchMove: onSwipeMove,
        onTouchEnd: onSwipeEnd,
        onTouchCancel: onSwipeEnd,
        style: { touchAction: "none" } as React.CSSProperties,
    };

    useEffect(() => {
        if (!isFullscreen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") toggleFullscreen();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen, toggleFullscreen]);

    if (!currentTrack) return null;

    const audioSrc = audioSrcFor(currentTrack);
    const isSeekable = true; // и R2, и кэш YouTube отдаются с поддержкой перемотки

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

    // Кнопка очереди в панели плеера (на телефоне вход в очередь есть в меню настроек)
    const queueButton = (
        <button
            type="button"
            data-queue-toggle
            onClick={() => setQueueOpen((v) => !v)}
            title="Очередь воспроизведения"
            aria-label="Очередь воспроизведения"
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7m6-4v6m-3-3h6" />
            </svg>
        </button>
    );

    // Кнопка обрезки (на телефоне вход есть в меню настроек плеера)
    const trimButton = (
        <button
            type="button"
            onClick={() => setTrimOpen(true)}
            title="Обрезать трек"
            aria-label="Обрезать трек"
            className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTrim ? "text-indigo-300 bg-indigo-500/15" : "text-zinc-300 hover:text-white hover:bg-white/15"
            }`}
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
        </button>
    );

    return (
        <>
            {!isPipOpen && (
                <div
                    ref={fsRef}
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
                            <AmbientBlobs color={ambientColor} />

                            {/* Верхняя зона: за неё можно потянуть вниз, чтобы закрыть */}
                            <div
                                className="w-full max-w-5xl mx-auto z-10 shrink-0 mb-4"
                                {...swipeHandlers}
                            >
                                <div className="sm:hidden mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                        <span className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
                                            Сейчас играет
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setVinyl((v) => !v)}
                                            aria-pressed={vinyl}
                                            title="Режим винила"
                                            className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                                                vinyl
                                                    ? "bg-white/20 border-white/30 text-white"
                                                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <circle cx="12" cy="12" r="9" />
                                                <circle cx="12" cy="12" r="2.5" />
                                            </svg>
                                            Винил
                                        </button>

                                        <button
                                            type="button"
                                            onClick={toggleFullscreen}
                                            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer shadow-lg text-lg"
                                            title="Свернуть (Esc)"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 my-auto z-10 py-2 min-h-0">
                                <div
                                    className="flex flex-col items-center justify-center text-center gap-6 w-full lg:w-1/2"
                                    {...swipeHandlers}
                                >
                                    <SpinningCover
                                        src={coverSrc}
                                        alt={currentTrack.title}
                                        color={ambientColor}
                                        playing={isPlaying}
                                        vinyl={vinyl}
                                        onToggle={() => setVinyl((v) => !v)}
                                    />
                                    <div className="space-y-1.5 max-w-md px-4">
                                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white truncate">
                                            {currentTrack.title}
                                        </h2>
                                        <p className="text-base sm:text-lg text-zinc-300 font-medium truncate">
                                            {currentTrack.artist || "Неизвестный исполнитель"}
                                        </p>
                                    </div>
                                </div>

                                <FullscreenSidePanel track={currentTrack} seekable={isSeekable} />
                            </div>
                        </>
                    )}

                    {/* Плеер (в нижней панели или внизу полноэкранного режима) */}
                    <div className="relative w-full flex items-center">
                        {activeTrim && (
                            <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-300/30 backdrop-blur-xl text-[11px] font-semibold text-indigo-100 whitespace-nowrap">
                                <span>✂ Играет отрезок {formatClock(activeTrim.start)}–{formatClock(activeTrim.end)}</span>
                                <button
                                    type="button"
                                    onClick={clearTrim}
                                    aria-label="Играть трек целиком"
                                    title="Играть трек целиком"
                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
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
                            onOpenQueue={() => setQueueOpen(true)}
                            trim={activeTrim}
                            onOpenTrim={() => setTrimOpen(true)}
                            extraRightControls={<>{queueButton}{trimButton}{pipButton}</>}
                        />
                    </div>
                </div>
            )}

            <QueuePanel open={queueOpen && !isPipOpen} onClose={() => setQueueOpen(false)} />
            {trimOpen && (
                <TrimModal key={currentTrack._id} track={currentTrack} onClose={() => setTrimOpen(false)} />
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
                                trim={activeTrim}
                            />
                        </div>
                    </div>
                )}
        </>
    );
};