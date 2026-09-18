import { useState } from "react";
import { useUpdateTrackMutation } from "../api/use-update-track-mutation.ts";
import { useUploadTrackCoverMutation } from "../api/use-upload-track-cover-mutation.ts";
import { useDeleteTrackCoverMutation } from "../api/use-delete-track-cover-mutation.ts";

type Props = {
    trackId: string;
    initialTitle: string;
    initialCoverUrl?: string | null;
    onSuccess: () => void;
    onCancel?: () => void;
};

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const EditTrackForm = ({ trackId, initialTitle, initialCoverUrl, onSuccess, onCancel }: Props) => {
    const [title, setTitle] = useState(initialTitle);

    const { mutate: updateTitle, isPending: isSavingTitle } = useUpdateTrackMutation();
    const { mutate: uploadCover, isPending: isUploadingCover } = useUploadTrackCoverMutation();
    const { mutate: deleteCover, isPending: isDeletingCover } = useDeleteTrackCoverMutation();

    const isLoading = isSavingTitle || isUploadingCover || isDeletingCover;

    const coverUrl = initialCoverUrl ? `${MY_API_BASE}${initialCoverUrl}` : null;

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadCover({ trackId, cover: file });
        }
    };

    const handleDeleteCover = () => {
        deleteCover(trackId);
    };

    const handleSaveTitle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        updateTitle({ trackId, title: title.trim() }, { onSuccess });
    };

    return (
        <div className="space-y-6">
            <h2 className="w-full text-3xl font-extrabold text-white text-center">
                Edit Track
            </h2>

            <div className="space-y-2">
                <label className="block text-base font-medium text-zinc-300 text-center mb-2">
                    Cover
                </label>

                {coverUrl ? (
                    <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500/50 group shadow-lg">
                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                                Изменить
                                <input type="file" accept="image/*" onChange={handleCoverChange} disabled={isLoading} className="hidden" />
                            </label>
                            <button
                                type="button"
                                onClick={handleDeleteCover}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#3f3f46] hover:border-indigo-500/80 rounded-2xl cursor-pointer bg-[#27272a]/40 hover:bg-[#27272a]/70 transition-all group">
                        <span className="text-xs font-semibold text-zinc-400 group-hover:text-indigo-400">
                            {isUploadingCover ? 'Загрузка...' : 'Добавить обложку'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleCoverChange} disabled={isLoading} className="hidden" />
                    </label>
                )}
            </div>

            <form onSubmit={handleSaveTitle} className="space-y-2">
                <label htmlFor="track-title" className="block text-base font-medium text-zinc-300">
                    Title
                </label>
                <input
                    id="track-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />

                <div className="flex items-center justify-center gap-4 pt-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            Отмена
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !title.trim()}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
                    >
                        {isSavingTitle ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </form>
        </div>
    );
};