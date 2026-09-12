import { useMemo, useEffect } from "react";
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { type CreatePlaylistFormValues } from "../api/use-create-playlist-mutation.ts";

interface CoverImageUploadProps {
    register: UseFormRegister<CreatePlaylistFormValues>;
    watch: UseFormWatch<CreatePlaylistFormValues>;
    setValue: UseFormSetValue<CreatePlaylistFormValues>;
    disabled?: boolean;
    error?: string;
}

export const CoverImageUpload = ({
                                     register,
                                     watch,
                                     setValue,
                                     disabled = false,
                                     error,
                                 }: CoverImageUploadProps) => {
    const fileList = watch("file") as unknown as FileList | undefined;
    const selectedFile = fileList && fileList.length > 0 ? fileList[0] : null;

    // 1. Создаем URL через useMemo (без useState и лишних рендеров)
    const previewUrl = useMemo(() => {
        if (!selectedFile) return null;
        const objectUrl = URL.createObjectURL(selectedFile);
        console.log("🟢 Создан Blob URL:", objectUrl);
        return objectUrl;
    }, [selectedFile]);

    // 2. Очищаем старый URL при изменении файла или размонтировании
    useEffect(() => {
        return () => {
            if (previewUrl) {
                console.log("🔴 Очищен (revoked) Blob URL:", previewUrl);
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            type="button"
                            // Добавили параметры для точного сброса состояния формы
                            onClick={() => setValue("file", null, { shouldValidate: true, shouldDirty: true })}
                            disabled={disabled}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:pointer-events-none"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#3f3f46] hover:border-indigo-500/80 rounded-2xl cursor-pointer bg-[#27272a]/40 hover:bg-[#27272a]/70 transition-all group">
                    <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-semibold">Выберите обложку</span>
                        <span className="text-[10px] text-zinc-500 mt-1">Квадрат, мин. 500x500px</span>
                    </div>
                    <input
                        {...register("file")}
                        type="file"
                        accept="image/*"
                        disabled={disabled}
                        className="hidden"
                    />
                </label>
            )}

            {error && (
                <p className="text-red-400 text-xs font-medium text-center mt-1">
                    {error}
                </p>
            )}
        </div>
    );
};