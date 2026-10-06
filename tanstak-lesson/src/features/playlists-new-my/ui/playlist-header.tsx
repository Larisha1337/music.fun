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
        <div className="w-full bg-gradient-to-b from-[#53389e] via-[#241b35] to-[#121212] px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 md:pt-16 pb-6 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 shadow-2xl text-center sm:text-left">
            {/* Большая обложка Плейлиста */}
            <div className="relative group w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-md bg-zinc-800 flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-bold shrink-0 overflow-hidden shadow-2xl">
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
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1ed760] hover:bg-[#1db954] flex items-center justify-center text-black text-lg sm:text-xl pl-0.5 shadow-2xl transition-transform hover:scale-105">
                            ▶
                        </div>
                    </button>
                )}
            </div>

            {/* Текстовая информация (min-w-0 обязателен для корректной работы truncate во flex) */}
            <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 w-full">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Плейлист
                </span>

                {/* Название с обрезом через truncate (...) */}
                <h1
                    onClick={onOpenModal}
                    className="text-2xl sm:text-4xl md:text-5xl font-black text-white mt-0.5 hover:underline decoration-zinc-400 cursor-pointer tracking-tight min-w-0 block"
                    title={playlist.name} // При наведении будет всплывать подсказка с полным именем
                >
                    <span className="block truncate">{playlist.name}</span>
                </h1>

                <p className="text-sm text-zinc-300 mt-1 sm:mt-2 font-medium">
                    Треков: <span className="text-white font-semibold">{tracksCount}</span>
                </p>
            </div>
        </div>
    );
};