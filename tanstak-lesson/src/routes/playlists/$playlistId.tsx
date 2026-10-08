import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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

    const { currentTrack, playTrack, closePlayer, isShuffle, toggleShuffle } = useAudioPlayer();

    const [localTracks, setLocalTracks] = useState<any[]>([]);

    useEffect(() => {
        if (playlist?.tracks) {
            setLocalTracks(playlist.tracks);
        }
    }, [playlist?.tracks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [trackToRemove, setTrackToRemove] = useState<{ id: string; title: string } | null>(null);
    const [isDeletePlaylistConfirmOpen, setIsDeletePlaylistConfirmOpen] = useState(false);

    if (isLoading) {
        return <div className="p-6 text-zinc-400">Загрузка...</div>;
    }

    if (!playlist) {
        return <div className="p-6 text-red-400">Плейлист не найден</div>;
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = localTracks.findIndex((t) => t._id === active.id);
            const newIndex = localTracks.findIndex((t) => t._id === over.id);

            const newTracks = arrayMove(localTracks, oldIndex, newIndex);
            setLocalTracks(newTracks);

            const trackIds = newTracks.map((t) => t._id);
            const formData = new FormData();
            formData.append("name", playlist.name);
            formData.append("tracks", JSON.stringify(trackIds));

            updatePlaylist(formData);
        }
    };

    // Случайный трек из плейлиста + включаем shuffle, чтобы следующие тоже шли вперемешку
    const handlePlayShuffled = () => {
        if (localTracks.length === 0) return;

        if (!isShuffle) toggleShuffle();

        // Не выбираем тот трек, что уже играет (если в плейлисте есть другие)
        const pool =
            localTracks.length > 1
                ? localTracks.filter((t) => t._id !== currentTrack?._id)
                : localTracks;

        const random = pool[Math.floor(Math.random() * pool.length)];
        playTrack(random, localTracks);
    };

    const handleSavePlaylist = (formData: FormData) => {
        updatePlaylist(formData, {
            onSuccess: () => setIsPlaylistModalOpen(false)
        });
    };

    const handleConfirmRemoveTrack = () => {
        if (!trackToRemove) return;
        if (currentTrack?._id === trackToRemove.id) {
            closePlayer();
        }
        removeTrack(trackToRemove.id, {
            onSuccess: () => setTrackToRemove(null)
        });
    };

    const handleConfirmDeletePlaylist = () => {
        deletePlaylist(playlistId, {
            onSuccess: () => {
                setIsDeletePlaylistConfirmOpen(false);
                setIsPlaylistModalOpen(false);
                closePlayer();
                navigate({ to: "/playlists" });
            }
        });
    };

    const cover = getImageUrl(playlist.coverUrl);

    return (
        <div className="flex flex-col gap-6 p-6 sm:p-8 text-zinc-100 w-full min-h-full bg-[#121212] overflow-y-auto custom-scrollbar">
            {/* Кнопка возврата назад (для мобильных) */}
            <div className="flex md:hidden items-center">
                <Link
                    to="/playlists"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>К списку плейлистов</span>
                </Link>
            </div>

            {/* КОМПАКТНАЯ ШАПКА ПЛЕЙЛИСТА (в стиле Spotify) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#18181b]/50 to-[#121212] border border-white/5 shadow-xl">
                {/* Аккуратная обложка фиксированного размера */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-zinc-800 shadow-lg flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                    {cover ? (
                        <img src={cover} alt={playlist.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl">🎵</span>
                    )}
                </div>

                {/* Информация и кнопки управления */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Плейлист
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white truncate" title={playlist.name}>
                        {playlist.name}
                    </h1>
                    {playlist.description && (
                        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">
                            {playlist.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span className="text-white font-medium">Медиатека</span>
                        <span>•</span>
                        <span>{localTracks.length} треков</span>
                    </div>

                    {/* Кнопки действий (Слушать / Вперемешку / Редактировать) */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        {localTracks.length > 0 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => playTrack(localTracks[0], localTracks)}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Слушать
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePlayShuffled}
                                    aria-pressed={isShuffle}
                                    title="Включить случайный трек из плейлиста"
                                    className={`px-4 py-2.5 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 border ${
                                        isShuffle
                                            ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/30"
                                            : "bg-white/10 border-white/5 text-white hover:bg-white/15"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                                    </svg>
                                    Вперемешку
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsPlaylistModalOpen(true)}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer border border-white/5"
                        >
                            Редактировать
                        </button>
                    </div>
                </div>
            </div>

            {/* СПИСОК ТРЕКОВ НА ВСЮ ШИРИНУ */}
            <div className="flex flex-col gap-2 w-full mt-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Треки
                </h3>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={localTracks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-1.5 w-full">
                            {localTracks.length === 0 ? (
                                <div className="text-zinc-500 text-sm p-12 text-center bg-[#18181b]/40 rounded-2xl border border-[#27272a]/50">
                                    В этом плейлисте пока нет треков. Нажмите «Редактировать», чтобы добавить музыку.
                                </div>
                            ) : (
                                localTracks.map((track, index) => (
                                    <PlaylistTrackItem
                                        key={track._id}
                                        track={track}
                                        index={index}
                                        isCurrent={currentTrack?._id === track._id}
                                        playlistTracks={localTracks}
                                        onPlay={() => playTrack(track, localTracks)}
                                        onRequestRemove={() => setTrackToRemove({ id: track._id, title: track.title })}
                                        getImageUrl={getImageUrl}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Модальное окно */}
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

            {/* Модалки подтверждения */}
            <ConfirmModal
                isOpen={!!trackToRemove}
                onClose={() => setTrackToRemove(null)}
                onConfirm={handleConfirmRemoveTrack}
                title="Удаление трека из плейлиста"
                description={`Вы уверены, что хотите удалить трек "${trackToRemove?.title}" из этого плейлиста?`}
                confirmText="Удалить"
            />

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