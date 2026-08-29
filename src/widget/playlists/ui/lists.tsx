import { DeletePlaylists } from "../../../features/playlists/delete-playlists/ui/delete-playlists.tsx";
import { EditPlaylistModal } from "../../../features/playlists/edit-playlists/ui/edit-playlists-modal.tsx";

type PlaylistListProps = {
    playlists: any[];
    currentUserId?: string;
};

export const Lists = ({ playlists, currentUserId }: PlaylistListProps) => {
    return (
        <ul className="flex flex-col gap-4">
            {playlists.map((playlist) => {
                const imageUrl = playlist.attributes.images.main?.[0]?.url;
                const isOwner = Boolean(currentUserId && playlist.attributes.user.id === currentUserId);

                return (
                    <li key={playlist.id}>
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

                                <div className="flex flex-col">
                                    <span className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight break-all">
                                        {playlist.attributes.title}
                                    </span>

                                    {/* Локальное описание */}
                                    {(() => {
                                        const savedDescriptions = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                                        const description = (playlist.attributes as any).description || savedDescriptions[playlist.id];

                                        return description ? (
                                            <span className="text-sm text-zinc-400 mt-1 break-all">
                                                {description}
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            {isOwner && (
                                <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                                    <EditPlaylistModal
                                        playlistId={playlist.id}
                                        initialTitle={playlist.attributes.title}
                                        initialDescription={(playlist.attributes as any).description || ''}
                                    />
                                    <span className="text-zinc-600">|</span>
                                    <DeletePlaylists playlistId={playlist.id} />
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};