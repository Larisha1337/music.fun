import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
   type DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
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

    // Локальный стейт треков для мгновенного визуального перетаскивания
    const [localTracks, setLocalTracks] = useState<any[]>([]);

    // Синхронизируем локальный стейт при загрузке/обновлении данных с сервера
    useEffect(() => {
        if (playlist?.tracks) {
            setLocalTracks(playlist.tracks);
        }
    }, [playlist?.tracks]);

    // Настройка сенсоров для dnd-kit (чтобы перетаскивание работало плавно)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Требуется сдвинуть курсор на 5px, чтобы начать перетаскивание (не мешает кликам)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Обработчик окончания перетаскивания
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = localTracks.findIndex((t) => t._id === active.id);
            const newIndex = localTracks.findIndex((t) => t._id === over.id);

            const newTracks = arrayMove(localTracks, oldIndex, newIndex);
            setLocalTracks(newTracks); // Мгновенно обновляем интерфейс

            // Формируем массив ID в новом порядке и отправляем на бэкенд
            const trackIds = newTracks.map((t) => t._id);
            const formData = new FormData();
            formData.append("name", playlist.name);
            formData.append("tracks", JSON.stringify(trackIds));

            updatePlaylist(formData);
        }
    };

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
                onPlayPlaylist={() => localTracks[0] && playTrack(localTracks[0], localTracks)}
                onOpenModal={() => setIsPlaylistModalOpen(true)}
                getImageUrl={getImageUrl}
            />

            {/* Список треков с поддержкой Drag-and-Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={localTracks.map((t) => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2">
                        {localTracks.length === 0 ? (
                            <div className="text-zinc-500 text-sm p-8 text-center bg-[#18181b] rounded-2xl border border-[#27272a]">
                                В этом плейлисте пока нет треков. Нажмите «⚙️ Настройки» ➔ «Добавить треки», чтобы пополнить список.
                            </div>
                        ) : (
                            localTracks.map((track, index) => (
                                <PlaylistTrackItem
                                    key={track._id}
                                    track={track}
                                    index={index}
                                    isCurrent={currentTrack?._id === track._id}
                                    onPlay={() => playTrack(track, localTracks)}
                                    onRequestRemove={() => setTrackToRemove({ id: track._id, title: track.title })}
                                    getImageUrl={getImageUrl}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>

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