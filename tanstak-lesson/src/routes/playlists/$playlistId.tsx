import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    usePlaylistQuery,
    useRemoveTrackFromPlaylistMutation,
    useAddTrackToPlaylistMutation,
    useUpdatePlaylistMutation,
    useDeletePlaylistMutation
} from "@/features/playlists-new-my/api/use-playlists-query";
import { useAudioPlayer } from "@/shared/ui/lib/audio-player-context";
import { ConfirmModal } from "@/shared/ui/modal/confirm-modal";
import { useAllTracksQuery } from "@/features/tracks/public/api/use-all-tracks-query.ts";
import { PlaylistHeader } from "@/features/playlists-new-my/ui/playlist-header";
import { PlaylistTrackItem } from "@/features/playlists-new-my/ui/playlist-track-item";
import { PlaylistModal } from "@/features/playlists-new-my/ui/playlist-modal";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || "http://localhost:5000";

const getImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${MY_API_BASE}${url}`;
};

export const Route = createFileRoute("/playlists/$playlistId")({
    component: PlaylistDetailPage
});

function PlaylistDetailPage() {
    const { playlistId } = Route.useParams();
    const navigate = useNavigate();

    // API Мутации и Запросы
    const { data: playlist, isLoading } = usePlaylistQuery(playlistId);
    const { data: allTracks = [], isLoading: isLoadingAllTracks } = useAllTracksQuery();

    const { mutate: removeTrack } = useRemoveTrackFromPlaylistMutation(playlistId);
    const { mutate: addTrack } = useAddTrackToPlaylistMutation();
    const { mutate: updatePlaylist, isPending: isUpdating } = useUpdatePlaylistMutation(playlistId);
    const { mutate: deletePlaylist, isPending: isDeleting } = useDeletePlaylistMutation();

    const { currentTrack, playTrack } = useAudioPlayer();

    // Состояния модалок
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [trackToRemove, setTrackToRemove] = useState<{ id: string; title: string } | null>(null);
    const [isDeletePlaylistConfirmOpen, setIsDeletePlaylistConfirmOpen] = useState(false);

    if (isLoading) {
        return <div className="p-6 text-zinc-400">Загрузка...</div>;
    }

    if (!playlist) {
        return <div className="p-6 text-red-400">Плейлист не найден</div>;
    }

    const tracks = playlist.tracks || [];

    // Обработчики
    const handleSavePlaylist = (formData: FormData) => {
        updatePlaylist(formData, {
            onSuccess: () => setIsPlaylistModalOpen(false)
        });
    };

    const handleConfirmRemoveTrack = () => {
        if (!trackToRemove) return;
        removeTrack(trackToRemove.id, {
            onSuccess: () => setTrackToRemove(null)
        });
    };

    const handleConfirmDeletePlaylist = () => {
        deletePlaylist(playlistId, {
            onSuccess: () => {
                setIsDeletePlaylistConfirmOpen(false);
                setIsPlaylistModalOpen(false);
                navigate({ to: "/" });
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 text-zinc-100 max-w-5xl">
            {/* Шапка плейлиста */}
            <PlaylistHeader
                playlist={playlist}
                onPlayPlaylist={() => tracks[0] && playTrack(tracks[0], tracks)}
                onOpenModal={() => setIsPlaylistModalOpen(true)}
                getImageUrl={getImageUrl}
            />

            {/* Список треков */}
            <div className="flex flex-col gap-2">
                {tracks.length === 0 ? (
                    <div className="text-zinc-500 text-sm p-8 text-center bg-[#18181b] rounded-2xl border border-[#27272a]">
                        В этом плейлисте пока нет треков. Нажмите «⚙️ Настройки» ➔ «Добавить треки», чтобы пополнить список.
                    </div>
                ) : (
                    tracks.map((track, index) => (
                        <PlaylistTrackItem
                            key={track._id}
                            track={track}
                            index={index}
                            isCurrent={currentTrack?._id === track._id}
                            onPlay={() => playTrack(track, tracks)}
                            onRequestRemove={() => setTrackToRemove({ id: track._id, title: track.title })}
                            getImageUrl={getImageUrl}
                        />
                    ))
                )}
            </div>

            {/* Единое модальное окно управления плейлистом */}
            <PlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                playlist={playlist}
                allTracks={allTracks}
                isLoadingAllTracks={isLoadingAllTracks}
                onSavePlaylist={handleSavePlaylist}
                onAddTrack={(trackId) => addTrack({ playlistId, trackId })}
                onDeletePlaylist={() => setIsDeletePlaylistConfirmOpen(true)}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                getImageUrl={getImageUrl}
            />

            {/* Подтверждение удаления трека из плейлиста */}
            <ConfirmModal
                isOpen={!!trackToRemove}
                onClose={() => setTrackToRemove(null)}
                onConfirm={handleConfirmRemoveTrack}
                title="Удаление трека из плейлиста"
                description={`Вы уверены, что хотите удалить трек "${trackToRemove?.title}" из этого плейлиста?`}
                confirmText="Удалить"
            />

            {/* Подтверждение удаления самого плейлиста */}
            <ConfirmModal
                isOpen={isDeletePlaylistConfirmOpen}
                onClose={() => setIsDeletePlaylistConfirmOpen(false)}
                onConfirm={handleConfirmDeletePlaylist}
                title="Удаление плейлиста"
                description={`Вы уверены, что хотите полностью удалить плейлист "${playlist.name}"?`}
                confirmText="Удалить плейлист"
                isLoading={isDeleting}
            />
        </div>
    );
}