import { useAudioPlayer } from "@/shared/ui/lib/audio-player-context";
import { CustomAudioPlayer } from "@/shared/ui/audio-player/custom-audio-player";
import { useCoverColor } from "@/shared/ui/lib/use-cover-color";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000';

export const GlobalPlayer = () => {
    const { currentTrack, playNext, playPrev, closePlayer } = useAudioPlayer();

    const coverSrc = currentTrack?.coverUrl
        ? currentTrack.coverUrl.startsWith('http')
            ? currentTrack.coverUrl
            : `${MY_API_BASE}${currentTrack.coverUrl}`
        : null;

    // Вычисляем доминирующий цвет обложки
    const ambientColor = useCoverColor(coverSrc, '#6366f1');

    if (!currentTrack) return null;

    const audioSrc = `${MY_API_BASE}${currentTrack.fileUrl}`;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] transition-all duration-700">
            {/* 1. Внешний мягкий размытый ореол (Ambient Glow) */}
            <div
                className="absolute inset-0 -z-10 blur-3xl opacity-40 transition-all duration-700 pointer-events-none scale-y-125"
                style={{ backgroundColor: ambientColor }}
            />

            {/* 2. Основная панель плеера с диначеской цветной тенью */}
            <div
                className="relative bg-[#18181b]/90 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 transition-all duration-700"
                style={{
                    boxShadow: `0 -15px 40px -10px ${ambientColor}33` // 33 = ~20% прозрачности
                }}
            >
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                    {/* Информация о треке */}
                    <div className="flex items-center gap-3 w-full sm:w-1/4 min-w-0 shrink-0">
                        {/* Обложка с аккуратным внутренним свечением */}
                        <div
                            className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#27272a] border border-white/10 flex items-center justify-center shadow-lg transition-all duration-700"
                            style={{
                                boxShadow: `0 4px 20px ${ambientColor}40`
                            }}
                        >
                            {coverSrc ? (
                                <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-zinc-500 text-sm">🎵</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                            <span className="text-sm font-bold text-zinc-100 truncate">{currentTrack.title}</span>
                            <span className="text-[11px] text-zinc-400 truncate">Playing now</span>
                        </div>
                    </div>

                    {/* Плеер */}
                    <div className="flex-1 w-full">
                        <CustomAudioPlayer
                            key={currentTrack._id}
                            src={audioSrc}
                            title={currentTrack.title}
                            coverSrc={coverSrc}
                            autoPlay
                            onEnded={playNext}
                            onNext={playNext}
                            onPrev={playPrev}
                        />
                    </div>

                    {/* Кнопка закрытия */}
                    <button
                        onClick={closePlayer}
                        className="absolute right-4 top-4 sm:static w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};