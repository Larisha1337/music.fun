import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "@/shared/ui/modal/remove-modal.tsx";

interface Track {
    _id: string;
    title: string;
    artist?: string;
    coverUrl?: string | null;
}

interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: {
        _id: string;
        name: string;
        coverUrl?: string | null;
        tracks?: Track[];
    };
    allTracks: Track[];
    isLoadingAllTracks?: boolean;
    onSavePlaylist: (formData: FormData) => void;
    onAddTrack: (trackId: string) => void;
    onDeletePlaylist: () => void;
    isUpdating?: boolean;
    isDeleting?: boolean;
    getImageUrl: (url?: string | null) => string;
}

export const PlaylistModal = ({
                                  isOpen,
                                  onClose,
                                  playlist,
                                  allTracks = [],
                                  isLoadingAllTracks = false,
                                  onSavePlaylist,
                                  onAddTrack,
                                  onDeletePlaylist,
                                  isUpdating,
                                  isDeleting,
                                  getImageUrl
                              }: PlaylistModalProps) => {
    const [activeTab, setActiveTab] = useState<"settings" | "add-tracks">("settings");
    const [name, setName] = useState(playlist.name);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            setName(playlist.name);
            setCoverFile(null);
            setCoverPreview(playlist.coverUrl ? getImageUrl(playlist.coverUrl) : null);
            setSearchQuery("");
            setActiveTab("settings");
        }
    }, [isOpen, playlist]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", name);
        if (coverFile) {
            formData.append("cover", coverFile);
        }
        onSavePlaylist(formData);
    };

    const existingTrackIds = (playlist.tracks || []).map((t) => t._id);

    const filteredTracks = allTracks.filter((track) => {
        const q = searchQuery.toLowerCase();
        return (
            track.title.toLowerCase().includes(q) ||
            (track.artist && track.artist.toLowerCase().includes(q))
        );
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Управление плейлистом" maxWidth="max-w-lg">
            {/* Переключатель вкладок */}
            <div className="flex border-b border-[#27272a] mb-4">
                <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                        activeTab === "settings"
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-zinc-400 hover:text-white"
                    }`}
                >⚙️ Настройки |
                  </button>




                <button
                    type="button"
                    onClick={() => setActiveTab("add-tracks")}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                        activeTab === "add-tracks"
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-zinc-400 hover:text-white"
                    }`}
                >
                         |  Добавить треки из библиотеки
                </button>
            </div>

            {/* Вкладка 1: Настройки плейлиста */}
            {activeTab === "settings" && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                        <label className="relative group w-24 h-24 rounded-2xl bg-zinc-800 border border-dashed border-zinc-600 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                            />
                            {coverPreview ? (
                                <img
                                    src={coverPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-zinc-400">
                                    <span className="text-2xl">🖼️</span>
                                    <span className="text-[10px]">Обложка</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium transition-opacity">
                                Изменить
                            </div>
                        </label>

                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-xs font-semibold text-zinc-400">Название плейлиста *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="px-3 py-2 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#27272a] mt-2">
                        <button
                            type="button"
                            onClick={onDeletePlaylist}
                            disabled={isDeleting}
                            className="px-3.5 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                            🗑️ Удалить плейлист
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdating || !name.trim()}
                                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                            >
                                {isUpdating ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Вкладка 2: Добавление треков из общей медиатеки */}
            {activeTab === "add-tracks" && (
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Поиск по названию или исполнителю..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3.5 py-2 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                        {isLoadingAllTracks ? (
                            <div className="text-center py-6 text-zinc-400 text-sm">Загрузка треков...</div>
                        ) : filteredTracks.length === 0 ? (
                            <div className="text-center py-6 text-zinc-500 text-sm">Треки не найдены</div>
                        ) : (
                            filteredTracks.map((track) => {
                                const isAdded = existingTrackIds.includes(track._id);

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
                                            disabled={isAdded}
                                            onClick={() => onAddTrack(track._id)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ml-3 cursor-pointer ${
                                                isAdded
                                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                            }`}
                                        >
                                            {isAdded ? "Добавлен" : "➕ Добавить"}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};