interface Track {
    _id: string;
    title: string;
    artist?: string;
    coverUrl?: string | null;
}

interface PlaylistTrackItemProps {
    track: Track;
    index: number;
    isCurrent: boolean;
    onPlay: () => void;
    onRequestRemove: () => void;
    getImageUrl: (url?: string | null) => string;
}

export const PlaylistTrackItem = ({
                                      track,
                                      index,
                                      isCurrent,
                                      onPlay,
                                      onRequestRemove,
                                      getImageUrl
                                  }: PlaylistTrackItemProps) => {
    return (
        <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${
                isCurrent
                    ? "bg-indigo-950/30 border-indigo-500/40"
                    : "bg-[#18181b] hover:bg-[#27272a] border-[#27272a]"
            }`}
        >
            <div className="flex items-center gap-4 truncate flex-1 min-w-0">
                <span className="text-xs text-zinc-500 font-medium w-5 text-center shrink-0">
                    {index + 1}
                </span>

                {/* Обложка трека */}
                <div
                    onClick={onPlay}
                    className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/50 cursor-pointer"
                    title="Воспроизвести"
                >
                    {track.coverUrl ? (
                        <img
                            src={getImageUrl(track.coverUrl)}
                            alt={track.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>
                    )}

                    <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                            isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                    >
                        <span className="text-white text-sm">▶</span>
                    </div>
                </div>

                {/* Название и исполнитель */}
                <div
                    onClick={onPlay}
                    className="truncate flex-1 cursor-pointer select-none py-1"
                    title="Включить трек"
                >
                    <div
                        className={`text-sm font-semibold truncate ${
                            isCurrent
                                ? "text-indigo-400"
                                : "text-white hover:text-indigo-300 transition-colors"
                        }`}
                    >
                        {track.title}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                        {track.artist || "Неизвестный исполнитель"}
                    </div>
                </div>
            </div>

            {/* Минус — вызывает модалку подтверждения удаления трека из плейлиста */}
            <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                    type="button"
                    onClick={onRequestRemove}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/60 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer text-base font-bold"
                    title="Удалить из плейлиста"
                >
                    −
                </button>
            </div>
        </div>
    );
};