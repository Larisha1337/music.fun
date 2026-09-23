import { useAudioPlayer } from "@/shared/ui/lib/audio-player-context";
import { CustomAudioPlayer } from "@/shared/ui/audio-player/custom-audio-player";
import { useCoverColor } from "@/shared/ui/lib/use-cover-color";
import { usePictureInPicture } from "@/shared/ui/lib/use-picture-in-picture";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || "http://localhost:5000";

const getMediaUrl = (url?: string | null): string | null => {
    if (!url) return null;
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `${MY_API_BASE}${url}`;
};

export const GlobalPlayer = () => {
    const {
        currentTrack,
        playNext,
        playPrev,
        closePlayer,
        repeatMode,
        isShuffle,
        toggleRepeatMode,
        toggleShuffle
    } = useAudioPlayer();

    const { isPipOpen, isSupported, togglePip, renderPip } = usePictureInPicture();

    const coverSrc = getMediaUrl(currentTrack?.coverUrl);
    const ambientColor = useCoverColor(coverSrc, "#6366f1");

    if (!currentTrack) return null;

    const audioSrc = getMediaUrl(currentTrack.fileUrl);
    if (!audioSrc) return null;

    return (
        <>
            {!isPipOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] transition-all duration-700">
                    <div
                        className="absolute inset-0 -z-10 blur-3xl opacity-40 transition-all duration-700 pointer-events-none scale-y-125"
                        style={{ backgroundColor: ambientColor }}
                    />

                    <div
                        className="relative bg-[#18181b]/90 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 transition-all duration-700"
                        style={{ boxShadow: `0 -15px 40px -10px ${ambientColor}33` }}
                    >
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                            <div className="flex items-center gap-3 w-full sm:w-1/4 min-w-0 shrink-0">
                                <div
                                    className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#27272a] border border-white/10 flex items-center justify-center shadow-lg transition-all duration-700"
                                    style={{ boxShadow: `0 4px 20px ${ambientColor}40` }}
                                >
                                    {coverSrc ? (
                                        <img
                                            src={coverSrc}
                                            alt={currentTrack.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg className="w-6 h-6 text-zinc-500 fill-current" viewBox="0 0 16 16">
                                            <path d="M8 3a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a6 6 0 1 1 12 0v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a5 5 0 0 0-5-5z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <span className="text-sm font-bold text-zinc-100 truncate">
                                        {currentTrack.title}
                                    </span>
                                    <span className="text-[11px] text-zinc-400 truncate">
                                        {currentTrack.artist || "Неизвестный исполнитель"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 w-full">
                                <CustomAudioPlayer
                                    src={audioSrc}
                                    title={currentTrack.title}
                                    coverSrc={coverSrc}
                                    ambientColor={ambientColor}
                                    repeatMode={repeatMode}
                                    isShuffle={isShuffle}
                                    onToggleRepeat={toggleRepeatMode}
                                    onToggleShuffle={toggleShuffle}
                                    onNext={playNext}
                                    onPrev={playPrev}
                                    onEnded={playNext}
                                    autoPlay
                                />
                            </div>

                            <div className="absolute right-4 top-4 sm:static flex items-center gap-2 shrink-0">
                                {isSupported && (
                                    <button
                                        onClick={togglePip}
                                        title={isPipOpen ? "Вернуть плеер" : "Вынести плеер поверх всех окон"}
                                        aria-label={isPipOpen ? "Вернуть плеер" : "Вынести плеер поверх всех окон"}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                )}

                                <button
                                    onClick={closePlayer}
                                    title="Закрыть плеер"
                                    aria-label="Закрыть плеер"
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {isPipOpen &&
                renderPip(
                    <div className="h-full w-full bg-[#18181b] text-white p-4 flex flex-col justify-between select-none font-sans relative overflow-hidden">
                        <div
                            className="absolute inset-0 -z-10 blur-2xl opacity-50 pointer-events-none"
                            style={{ backgroundColor: ambientColor }}
                        />

                        <div className="flex items-center justify-between z-10">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                Сейчас играет
                            </span>
                            <button
                                onClick={togglePip}
                                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Вернуть в окно
                            </button>
                        </div>

                        <div className="flex items-center gap-4 my-auto z-10">
                            <div
                                className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#27272a] border border-white/10 shadow-lg"
                                style={{ boxShadow: `0 4px 20px ${ambientColor}40` }}
                            >
                                {coverSrc ? (
                                    <img
                                        src={coverSrc}
                                        alt={currentTrack.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                        🎵
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-base font-bold text-white truncate">
                                    {currentTrack.title}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                    {currentTrack.artist || "Неизвестный исполнитель"}
                                </p>
                            </div>
                        </div>

                        <div className="z-10 w-full">
                            <CustomAudioPlayer
                                src={audioSrc}
                                title={currentTrack.title}
                                coverSrc={coverSrc}
                                ambientColor={ambientColor}
                                repeatMode={repeatMode}
                                isShuffle={isShuffle}
                                onToggleRepeat={toggleRepeatMode}
                                onToggleShuffle={toggleShuffle}
                                onNext={playNext}
                                onPrev={playPrev}
                                onEnded={playNext}
                                autoPlay
                            />
                        </div>
                    </div>
                )}
        </>
    );
};