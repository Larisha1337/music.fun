type Props = {
    playlist: any;
    description: string;
    isOwner: boolean;
    onClick: () => void;
};

export const PlaylistItem = ({ playlist, description, isOwner, onClick }: Props) => {
    const imageUrl = playlist.attributes.images.main?.[0]?.url;

    return (
        <li>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#18181b]/60 border border-[#27272a] rounded-2xl transition-all hover:border-zinc-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={playlist.attributes.title}
                            className="w-full sm:w-[250px] h-[100px] sm:h-[250px] object-cover rounded-xl shrink-0"
                        />
                    ) : (
                        <div className="w-full sm:w-[160px] h-[100px] sm:h-[50px] bg-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-500 shrink-0">
                            No cover
                        </div>
                    )}

                    {/* Текстовая область кликабельна для владельца */}
                    <div
                        onClick={onClick}
                        className={`flex flex-col ${isOwner ? 'cursor-pointer group' : ''}`}
                    >
                        <span className={`text-lg sm:text-xl font-bold text-zinc-100 tracking-tight break-all ${isOwner ? 'group-hover:text-indigo-400 transition-colors' : ''}`}>
                            {playlist.attributes.title}
                        </span>

                        {description ? (
                            <span className="text-sm text-zinc-400 mt-1 break-all">
                                {description}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </li>
    );
};