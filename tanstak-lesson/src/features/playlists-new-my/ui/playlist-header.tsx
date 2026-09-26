interface PlaylistHeaderProps {
    playlist: {
        _id: string;
        name: string;
        coverUrl?: string | null;
        tracks?: any[];
    };
    onPlayPlaylist: () => void;
    onOpenModal: () => void;
    getImageUrl: (url?: string | null) => string;
}

export const PlaylistHeader = ({
                                   playlist,
                                   onPlayPlaylist,
                                   onOpenModal,
                                   getImageUrl
                               }: PlaylistHeaderProps) => {
    const tracksCount = playlist.tracks?.length || 0;

    return (
        <div className="flex items-center justify-between gap-6 bg-[#18181b] p-6 rounded-2xl border border-[#27272a] shadow-xl">
            <div className="flex items-center gap-5">
                {/* Обложка Плейлиста */}
                <div className="relative group w-28 h-28 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-4xl font-bold shrink-0 overflow-hidden shadow-lg">
                    {playlist.coverUrl ? (
                        <img
                            src={getImageUrl(playlist.coverUrl)}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        "🎵"
                    )}
                    {tracksCount > 0 && (
                        <button
                            type="button"
                            onClick={onPlayPlaylist}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            title="Включить плейлист"
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl pl-1 shadow-xl">
                                ▶
                            </div>
                        </button>
                    )}
                </div>

                <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Плейлист
                    </span>
                    {/* Клик по названию открывает единую модалку */}
                    <h1
                        onClick={onOpenModal}
                        className="text-3xl font-bold text-white mt-0.5 hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2 group"
                        title="Управление плейлистом"
                    >
                        <span>{playlist.name}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-sm text-zinc-400 font-normal transition-opacity">
                            ✏️
                        </span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-2">
                        Треков: <span className="text-zinc-200 font-medium">{tracksCount}</span>
                    </p>
                </div>
            </div>


        </div>
    );
};