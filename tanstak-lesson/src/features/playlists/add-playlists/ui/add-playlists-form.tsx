import { useForm } from "react-hook-form";
import { useState } from "react";
import type { CreatePlaylistFormValues } from "../../playlists-images/api/use-create-playlist-mutation.ts";
import { CoverImageUpload } from "../../playlists-images/ui/cover-image-upload.tsx";
import { checkImageDimensions } from "../../playlists-images/api/check-images-dimensions.ts";

interface AddPlaylistFormProps {
    onSubmit: (formData: CreatePlaylistFormValues) => void;
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
    } = useForm<CreatePlaylistFormValues>();

    const handleFormSubmit = async (formData: CreatePlaylistFormValues) => {
        if (isLocalLoading) return;

        const imageFile = formData.file?.[0];

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

        setIsLocalLoading(true);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError("file", {
                type: "manual",
                message: err.message || "Ошибка загрузки обложки",
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
                Add New Playlist
            </h2>

            <CoverImageUpload
                register={register}
                watch={watch}
                setValue={setValue}
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