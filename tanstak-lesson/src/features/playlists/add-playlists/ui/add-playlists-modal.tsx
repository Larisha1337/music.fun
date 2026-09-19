import { useState, useRef } from "react";
import { AddPlaylistForm, type ExtendedPlaylistFormValues } from "./add-playlists-form.tsx";
import { useCreatePlaylistMutation } from "../api/use-add-mutation.ts";
// Укажи точный путь к хуку загрузки трека:
import { useUploadTrackMutation } from "../../../tracks/api/upload/use-upload-track-mutation.ts";

export const AddPlaylistModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const isSubmittingRef = useRef(false);

    // Достаем mutateAsync из обоих хуков
    const { mutateAsync: createPlaylist, isPending: isCreating, reset: resetCreate } = useCreatePlaylistMutation();
    const { mutateAsync: uploadTrack, isPending: isUploading, reset: resetUpload } = useUploadTrackMutation();

    const handleFormSubmit = async (formData: ExtendedPlaylistFormValues) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            // 1. Создаем плейлист и получаем результат
            const createdPlaylist = await createPlaylist({
                title: formData.title,
                description: formData.description,
                file: formData.file,
            });

            // Достаем id созданного плейлиста из ответа сервера
            const playlistId = createdPlaylist?.data?.id || createdPlaylist?.id;

            // 2. Отправляем MP3-файл
            await uploadTrack({
                title: formData.title,
                file: formData.mp3File,
                playlistId,
            });

            // 3. Закрываем модалку при успехе
            handleClose();
        } catch (error: any) {
            console.error("Ошибка при создании:", error);
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        isSubmittingRef.current = false;
        resetCreate();
        resetUpload();
    };

    const handleOpen = () => {
        resetCreate();
        resetUpload();
        setIsOpen(true);
    };

    const isPending = isCreating || isUploading;

    return (
        <>
            <button
                onClick={handleOpen}
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white font-semibold text-sm sm:text-base rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/40 cursor-pointer overflow-hidden border border-indigo-400/20"
            >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 group-hover:rotate-90 transition-transform duration-300">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </span>
                <span>Add New Playlist</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <AddPlaylistForm
                        onSubmit={handleFormSubmit}
                        onCancel={handleClose}
                        isPending={isPending}
                    />
                </div>
            )}
        </>
    );
};