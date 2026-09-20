import { useAudioPlayer } from "@/shared/ui/lib/audio-player-context";
import { CustomAudioPlayer } from "@/shared/ui/audio-player/custom-audio-player";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000';

export const GlobalPlayer = () => {
    const { currentTrack, playNext, playPrev, closePlayer } = useAudioPlayer();

    if (!currentTrack) return null;

    const audioSrc = `${MY_API_BASE}${currentTrack.fileUrl}`;
    const coverSrc = currentTrack.coverUrl
        ? currentTrack.coverUrl.startsWith('http')
            ? currentTrack.coverUrl
            : `${MY_API_BASE}${currentTrack.coverUrl}`
        : null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#18181b]/95 backdrop-blur-md border-t border-[#27272a] p-3 sm:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                {/* Информация о треке */}
                <div className="flex items-center gap-3 w-full sm:w-1/4 min-w-0 shrink-0">
                    <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-[#27272a] border border-zinc-700/50 flex items-center justify-center">
                        {coverSrc ? (
                            <img src={coverSrc} alt={currentTrack.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-zinc-500 text-sm">🎵</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-sm font-bold text-zinc-100 truncate">{currentTrack.title}</span>
                        <span className="text-[11px] text-zinc-500 truncate">Playing now</span>
                    </div>
                </div>

                {/* Плеер с кнопками управления */}
                <div className="flex-1 w-full">
                    <CustomAudioPlayer
                        key={currentTrack._id}
                        src={audioSrc}
                        autoPlay
                        onEnded={playNext}
                        onNext={playNext}
                        onPrev={playPrev}
                    />
                </div>

                {/* Кнопка закрытия плеера */}
                <button
                    onClick={closePlayer}
                    className="absolute right-4 top-4 sm:static w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#27272a] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};