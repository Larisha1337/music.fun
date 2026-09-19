import { useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { FormValues, Props } from "./type/edit-type.ts";
import { useEditPlaylistMutation } from "../../api/use-edit-mutation.ts";
import { checkImageDimensions } from "../../api/check-square-images.ts";
import {useDeletePlaylistCoverMutation} from "../../../../tracks/api/delete/use-delete-playlist-cover-mutation.ts";

export const EditPlaylistForm = ({
                                     playlistId,
                                     initialTitle = '',
                                     initialDescription = '',
                                     initialCoverUrl,
                                     onSuccess,
                                     onCancel,
                                 }: Props) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const {
        handleSubmit,
        register,
        watch,
        setValue,
        setError,
        clearErrors,
        formState: { isSubmitting, errors }
    } = useForm<FormValues>({
        defaultValues: {
            title: initialTitle,
            description: initialDescription,
        }
    });

    const { mutate: deleteCover, isPending: isDeletingCover } = useDeletePlaylistCoverMutation(onSuccess);

    const handleDeleteCover = () => {
        deleteCover(playlistId);
    };

    const { mutate, isPending } = useEditPlaylistMutation(playlistId, onSuccess);
    const isLoading = isPending || isSubmitting;

    // Регистрация скрытого инпута
    const { ref: registerRef, onChange: onFileChange, ...fileRegisterProps } = register("file");

    const fileList = watch("file") as unknown as FileList | undefined;
    const selectedFile = fileList && fileList.length > 0 ? fileList[0] : null;

    // Превью: новый выбранный файл или текущая обложка
    const previewUrl = useMemo(() => {
        if (selectedFile) {
            return URL.createObjectURL(selectedFile);
        }
        return initialCoverUrl || null;
    }, [selectedFile, initialCoverUrl]);

    useEffect(() => {
        return () => {
            if (selectedFile && previewUrl) {
                console.log("🔴 Очищен (revoked) Blob URL:", previewUrl);
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [selectedFile, previewUrl]);

    const onSubmit = async (formData: FormValues) => {
        const imageFile = formData.file?.[0];

        // 1. Клиентская валидация файла перед отправкой
        if (imageFile) {
            const { isValid, error } = await checkImageDimensions(imageFile);
            if (!isValid) {
                setError("file", {
                    type: "manual",
                    message: error,
                });
                return; // Останавливаем отправку
            }
        }

        // 2. Вызов мутации с обработкой ошибок сервера
        mutate(formData, {
            onError: (err: any) => {
                const serverError = err?.errors?.[0]?.detail || err?.title || "Ошибка загрузки обложки";
                setError("file", {
                    type: "manual",
                    message: serverError,
                });
            }
        });
    };

    const handleClearSelectedFile = () => {
        setValue("file", null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        clearErrors("file");
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative max-w-2xl mx-auto p-8 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl space-y-6 text-zinc-100"
        >
            {/* Кнопка закрытия модалки (крестик) */}
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-5 right-5 z-30 text-zinc-400 hover:text-white text-xl font-bold transition-colors cursor-pointer disabled:pointer-events-none"
                >
                    ✕
                </button>
            )}
            {/* Скрытый input всегда смонтирован в DOM */}
            <input
                type="file"
                accept="image/*"
                disabled={isLoading}
                className="hidden"
                {...fileRegisterProps}
                ref={(e) => {
                    registerRef(e);
                    fileInputRef.current = e;
                }}
                onChange={(e) => {
                    onFileChange(e);
                    clearErrors("file");
                }}
            />

            <h2 className="w-full text-3xl font-extrabold text-white text-center">
                Edit Playlist
            </h2>

            {/* Блок обложки */}
            <div className="space-y-2">
                <label className="block text-base font-medium text-zinc-300 text-center mb-2">
                    Cover Image
                </label>

                {previewUrl ? (
                    <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500/50 group shadow-lg">
                        <img
                            src={previewUrl}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                            >
                                Изменить
                            </button>
                            {selectedFile ? (
                                <button
                                    type="button"
                                    onClick={handleClearSelectedFile}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                                >
                                    Сбросить выбор
                                </button>
                            ) : initialCoverUrl ? (
                                <button
                                    type="button"
                                    onClick={handleDeleteCover}
                                    disabled={isLoading || isDeletingCover}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                                >
                                    {isDeletingCover ? "Удаление..." : "Удалить"}
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#3f3f46] hover:border-indigo-500/80 rounded-2xl cursor-pointer bg-[#27272a]/40 hover:bg-[#27272a]/70 transition-all group"
                    >
                        <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-semibold">Загрузить новую обложку</span>
                            <span className="text-[10px] text-zinc-500 mt-1">Квадрат, мин. 500x500px</span>
                        </div>
                    </button>
                )}

                {/* Ошибка валидации */}
                {errors.file?.message && (
                    <p className="text-red-400 text-xs font-medium text-center mt-1">
                        {errors.file.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="playlist-title" className="block text-base font-medium text-zinc-300">
                    Title
                </label>
                <input
                    {...register('title', { required: true })}
                    id="playlist-title"
                    type="text"
                    disabled={isLoading}
                    placeholder="e.g. Favorite Songs 2026"
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="playlist-desc" className="block text-base font-medium text-zinc-300">
                    Description
                </label>
                <textarea
                    {...register('description')}
                    id="playlist-desc"
                    rows={3}
                    disabled={isLoading}
                    placeholder="Add an optional description..."
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none disabled:opacity-50"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </button>
        </form>
    );
};