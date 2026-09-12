import { useState } from "react";
import { PlaylistActionsModal } from "./;';/playlist-actions-modals.tsx";
import { PlaylistItem } from "./;';/playlist-item.tsx"; // 💡 Импортируем карточку

type PlaylistListProps = {
    playlists: any[];
    currentUserId?: string;
};

export const Lists = ({ playlists, currentUserId }: PlaylistListProps) => {
    const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);

    // 💡 Оптимизация: парсим localStorage ОДИН РАЗ, а не на каждый плейлист в цикле
    const savedDescriptions = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');

    return (
        <>
            <ul className="flex flex-col gap-4">
                {playlists.map((playlist) => {
                    const isOwner = Boolean(
                        playlist.id.startsWith('temp-') ||
                        (currentUserId && playlist.attributes?.user?.id === currentUserId)
                    );
                    const description = (playlist.attributes as any).description || savedDescriptions[playlist.id] || '';

                    return (
                        <PlaylistItem
                            key={playlist.id}
                            playlist={playlist}
                            description={description}
                            isOwner={isOwner}
                            onClick={() => isOwner && setSelectedPlaylist(playlist)}
                        />
                    );
                })}
            </ul>

            {/* Модалка с действиями */}
            {selectedPlaylist && (
                <PlaylistActionsModal
                    playlistId={selectedPlaylist.id}
                    title={selectedPlaylist.attributes.title}
                    description={
                        (selectedPlaylist.attributes as any).description ||
                        savedDescriptions[selectedPlaylist.id] ||
                        ''
                    }
                    isOpen={Boolean(selectedPlaylist)}
                    onClose={() => setSelectedPlaylist(null)}
                />
            )}
        </>
    );
};