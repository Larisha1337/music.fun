import { useForm } from "react-hook-form";
import { useState } from "react";
import type { CreatePlaylistFormValues } from "../../playlists-images/api/use-create-playlist-mutation.ts";
import { CoverImageUpload } from "../../playlists-images/ui/cover-image-upload.tsx";
import { checkImageDimensions } from "../../playlists-images/api/check-images-dimensions.ts";
// Импортируем твою проверку MP3
import { checkMp3File } from "../../../tracks/api/check-mp3-file.ts";

// Расширяем типизацию формы, добавляя MP3 файл
export interface ExtendedPlaylistFormValues extends CreatePlaylistFormValues {
    mp3File: FileList;
}

interface AddPlaylistFormProps {
    onSubmit: (formData: ExtendedPlaylistFormValues) => void;
    onCancel?: () => void;
    isPending?: boolean;
}

export const AddPlaylistForm = ({ onSubmit, onCancel, isPending = false }: AddPlaylistFormProps) => {
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    const {
        handleSubmit,
        register,
        watch,
        setValue,
        setError,
        formState: { isSubmitting, errors }
    } = useForm<ExtendedPlaylistFormValues>();

    const handleFormSubmit = async (formData: ExtendedPlaylistFormValues) => {
        if (isLocalLoading) return;

        const imageFile = formData.file?.[0];
        const mp3File = formData.mp3File?.[0]; // Достаем MP3

        // 1. Валидация картинки
        if (imageFile) {
            const { isValid, error } = await checkImageDimensions(imageFile);
            if (!isValid) {
                setError("file", {
                    type: "manual",
                    message: error || "Изображение должно быть квадратным (1:1)",
                });
                return;
            }
        }

        // 2. Валидация MP3 файла
        if (mp3File) {
            const { isValid, error } = checkMp3File(mp3File);
            if (!isValid) {
                setError("mp3File", {
                    type: "manual",
                    message: error,
                });
                return;
            }
        }

        setIsLocalLoading(true);
        try {
            // Отправляем все данные дальше в родительский компонент
            await onSubmit(formData);
        } catch (err: any) {
            setError("file", {
                type: "manual",
                message: err.message || "Ошибка при создании",
            });
        } finally {
            setIsLocalLoading(false);
        }
    };

    const isLoading = isPending || isSubmitting || isLocalLoading;

    return (
        <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="relative max-w-lg w-full p-8 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl space-y-6 text-zinc-100"
        >
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:pointer-events-none"
                >
                    ✕
                </button>
            )}

            <h2 className="text-3xl font-extrabold tracking-tight text-white text-center mb-6">
                Add New Playlist & Track
            </h2>

            <CoverImageUpload
                register={register as any}
                watch={watch as any}
                setValue={setValue as any}
                disabled={isLoading}
                error={errors.file?.message}
            />

            <div className="space-y-2">
                <label htmlFor="playlist-title" className="block text-base font-medium text-zinc-300 text-center mb-2">
                    Title
                </label>
                <input
                    {...register("title", { required: true })}
                    id="playlist-title"
                    type="text"
                    disabled={isLoading}
                    placeholder="e.g. Favorite Songs 2026"
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-center text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="playlist-desc" className="block text-base font-medium text-zinc-300 text-center mb-2">
                    Description
                </label>
                <div className="flex justify-center w-full">
                    <textarea
                        {...register("description")}
                        id="playlist-desc"
                        rows={3}
                        disabled={isLoading}
                        placeholder="Add an optional description..."
                        className="px-5 py-3.5 w-full bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-center disabled:opacity-50"
                    />
                </div>
            </div>

            {/* ДОБАВЛЕН БЛОК ДЛЯ MP3 */}
            <div className="space-y-2">
                <label className="block text-base font-medium text-zinc-300 text-center mb-2">
                    MP3 File
                </label>
                <input
                    type="file"
                    accept="audio/mpeg,.mp3"
                    disabled={isLoading}
                    {...register('mp3File', { required: 'Выбери mp3-файл' })}
                    className="w-full text-sm text-zinc-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-medium hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer disabled:opacity-50"
                />
                <p className="text-[11px] text-zinc-500 text-center">Максимум 1 MB</p>
                {errors.mp3File?.message && (
                    <p className="text-red-400 text-xs font-medium text-center mt-1">
                        {errors.mp3File.message as string}
                    </p>
                )}
            </div>

            <hr className="opacity-10" />

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-base rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Создание...</span>
                    </>
                ) : (
                    "Create"
                )}
            </button>
        </form>
    );
};