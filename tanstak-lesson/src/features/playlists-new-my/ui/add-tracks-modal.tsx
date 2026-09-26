import { useState } from "react";
import { Modal } from "@/shared/ui/modal/remove-modal.tsx";

interface Track {
    _id: string;
    title: string;
    artist?: string;
    coverUrl?: string | null;
}

interface AddTracksModalProps {
    isOpen: boolean;
    onClose: () => void;
    allTracks: Track[];
    existingTrackIds: string[];
    onAddTrack: (trackId: string) => void;
    getImageUrl: (url?: string | null) => string;
    isLoadingTracks?: boolean;
}

export const AddTracksModal = ({
                                   isOpen,
                                   onClose,
                                   allTracks = [],
                                   existingTrackIds = [],
                                   onAddTrack,
                                   getImageUrl,
                                   isLoadingTracks
                               }: AddTracksModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const availableTracks = allTracks.filter((track) => {
        const matchesSearch =
            track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (track.artist && track.artist.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Добавить треки в плейлист" maxWidth="max-w-xl">
            <div className="flex flex-col gap-4 max-h-[70vh]">
                <input
                    type="text"
                    placeholder="Поиск по названию или исполнителю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3.5 py-2 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white focus:outline-none focus:border-indigo-500 shrink-0"
                />

                <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[50vh]">
                    {isLoadingTracks ? (
                        <div className="text-center py-6 text-zinc-400 text-sm">Загрузка всех треков...</div>
                    ) : availableTracks.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500 text-sm">Треки не найдены</div>
                    ) : (
                        availableTracks.map((track) => {
                            const isAlreadyInPlaylist = existingTrackIds.includes(track._id);

                            return (
                                <div
                                    key={track._id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#27272a]/50 border border-[#3f3f46]/40 hover:bg-[#27272a] transition-colors"
                                >
                                    <div className="flex items-center gap-3 truncate min-w-0">
                                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/50">
                                            {track.coverUrl ? (
                                                <img
                                                    src={getImageUrl(track.coverUrl)}
                                                    alt={track.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <div className="text-sm font-semibold text-white truncate">{track.title}</div>
                                            <div className="text-xs text-zinc-400 truncate">
                                                {track.artist || "Неизвестный исполнитель"}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isAlreadyInPlaylist}
                                        onClick={() => onAddTrack(track._id)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ml-3 cursor-pointer ${
                                            isAlreadyInPlaylist
                                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                        }`}
                                    >
                                        {isAlreadyInPlaylist ? "Добавлен" : "➕ Добавить"}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};