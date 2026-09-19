import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import type { UploadTrackFormValues } from '../api/use-upload-track-mutation.ts'
import { checkMp3File } from '../api/check-mp3-file.ts'

type Props = {
    onSubmit: (formData: UploadTrackFormValues) => void
    onCancel?: () => void
    isPending?: boolean
}

export const UploadTrackForm = ({ onSubmit, onCancel, isPending = false }: Props) => {
    const [isLocalLoading, setIsLocalLoading] = useState(false)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)

    const {
        handleSubmit,
        register,
        setError,
        watch,
        formState: { isSubmitting, errors }
    } = useForm<UploadTrackFormValues>()

    // Отслеживаем файл обложки для предпросмотра
    const coverFile = watch('cover')

    useEffect(() => {
        const file = coverFile?.[0]
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setCoverPreview(objectUrl)
            return () => URL.revokeObjectURL(objectUrl)
        } else {
            setCoverPreview(null)
        }
    }, [coverFile])

    const handleFormSubmit = async (formData: UploadTrackFormValues) => {
        if (isLocalLoading) return

        const file = formData.file?.[0]
        if (file) {
            const { isValid, error } = checkMp3File(file)
            if (!isValid) {
                setError('file', { type: 'manual', message: error })
                return
            }
        }

        setIsLocalLoading(true)
        try {
            await onSubmit(formData)
        } catch (err: any) {
            setError('file', { type: 'manual', message: err.message || 'Ошибка загрузки трека' })
        } finally {
            setIsLocalLoading(false)
        }
    }

    const isLoading = isPending || isSubmitting || isLocalLoading

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
                Upload Track
            </h2>

            {/* Поле загрузки обложки (аватарки) */}
            <div className="space-y-2">
                <label className="block text-base font-medium text-zinc-300 text-center mb-2">
                    Обложка
                </label>
                <div className="flex justify-center">
                    {coverPreview ? (
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-500/50 group shadow-lg">
                            <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                                    Изменить
                                    <input
                                        type="file"
                                        accept="image/*"
                                        {...register('cover')}
                                        disabled={isLoading}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-32 h-32 rounded-2xl border-2 border-dashed border-zinc-600 hover:border-indigo-500 bg-[#27272a]/40 hover:bg-[#27272a]/70 transition-colors cursor-pointer group shadow-sm">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xs font-medium text-zinc-500 group-hover:text-indigo-400 transition-colors text-center px-2">
                                    Добавить фото
                               </span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                {...register('cover')}
                                disabled={isLoading}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="track-title" className="block text-base font-medium text-zinc-300 text-center mb-2">
                    Название
                </label>
                <input
                    {...register('title', { required: true })}
                    id="track-title"
                    type="text"
                    disabled={isLoading}
                    placeholder="e.g. Midnight City"
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-center text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-base font-medium text-zinc-300 text-center mb-2">
                    MP3 файл
                </label>
                <input
                    type="file"
                    accept="audio/mpeg,.mp3"
                    disabled={isLoading}
                    {...register('file', { required: 'Выбери mp3-файл' })}
                    className="w-full text-sm text-zinc-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-medium hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer disabled:opacity-50"
                />
                <p className="text-[11px] text-zinc-500 text-center">Максимум 20 MB</p>
                {errors.file?.message && (
                    <p className="text-red-400 text-xs font-medium text-center mt-1">
                        {errors.file.message as string}
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
                        <span>Uploading...</span>
                    </>
                ) : (
                    'Upload'
                )}
            </button>
        </form>
    )
}