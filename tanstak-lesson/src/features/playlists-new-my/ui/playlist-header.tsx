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
        <div className="w-full bg-gradient-to-b from-[#53389e] via-[#241b35] to-[#121212] px-8 pt-16 pb-6 flex items-end gap-6 shadow-2xl">
            {/* Большая обложка Плейлиста */}
            <div className="relative group w-52 h-52 rounded-md bg-zinc-800 flex items-center justify-center text-6xl font-bold shrink-0 overflow-hidden shadow-2xl">
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
                        <div className="w-14 h-14 rounded-full bg-[#1ed760] hover:bg-[#1db954] flex items-center justify-center text-black text-xl pl-1 shadow-2xl transition-transform hover:scale-105">
                            ▶
                        </div>
                    </button>
                )}
            </div>

            {/* Текстовая информация */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Плейлист
                </span>

                {/* Клик по названию открывает единую модалку */}
                <h1
                    onClick={onOpenModal}
                    className="text-6xl font-black text-white mt-0.5 hover:underline decoration-zinc-400 cursor-pointer flex items-center gap-3 group tracking-tight"
                    title="Управление плейлистом"
                >
                    <span>{playlist.name}</span>
                </h1>

                <p className="text-sm text-zinc-300 mt-2 font-medium">
                    Треков: <span className="text-white font-semibold">{tracksCount}</span>
                </p>
            </div>
        </div>
    );
};