import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useMyPlaylistsQuery, useCreatePlaylistMutation } from '@/features/playlists-new-my/api/use-playlists-query.ts'
import { useMeQuery } from '@/hooks/useMeQuery.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

const getImageUrl = (url?: string | null) => {
    if (!url) return null
    return url.startsWith('http') ? url : `${MY_API_BASE}${url}`
}

export const PlaylistsSidebar = () => {
    const { data: user } = useMeQuery()
    const { data: playlists, isLoading } = useMyPlaylistsQuery()
    const { mutate: createPlaylist, isPending } = useCreatePlaylistMutation()

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!user) return null

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverFile(file)
            setCoverPreview(URL.createObjectURL(file))
        }
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        const formData = new FormData()
        formData.append('name', name.trim())
        if (description.trim()) formData.append('description', description.trim())
        if (coverFile) formData.append('cover', coverFile)

        createPlaylist(formData, {
            onSuccess: () => {
                setName('')
                setDescription('')
                setCoverFile(null)
                setCoverPreview(null)
                setIsCreateOpen(false)
            }
        })
    }

    return (
        <div className="flex flex-col gap-4 p-4 bg-[#18181b] border border-[#27272a] rounded-2xl">
            <div className="flex items-center justify-between">
                <h3 className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    Мои плейлисты
                </h3>
                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-[#27272a] border border-transparent hover:border-[#3f3f46] transition-all cursor-pointer"
                    title="Создать плейлист"
                >
                    <span className="text-xl font-light leading-none">+</span>
                </button>
            </div>

            {/* Список плейлистов */}
            <div className="flex flex-col gap-1.5">
                {isLoading && (
                    <span className="text-zinc-500 text-sm px-2 py-1.5">Загрузка...</span>
                )}

                {!isLoading && playlists?.length === 0 && (
                    <span className="text-zinc-500 text-xs px-2 py-1.5">У вас пока нет плейлистов</span>
                )}

                {playlists?.map((playlist) => {
                    const cover = getImageUrl(playlist.coverUrl)
                    return (
                        <Link
                            key={playlist._id}
                            to="/playlists/$playlistId"
                            params={{ playlistId: playlist._id }}
                            className="flex items-center gap-3 p-2 hover:bg-[#27272a] rounded-xl transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
                                {cover ? (
                                    <img src={cover} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs">🎵</span>
                                )}
                            </div>
                            <span className="text-zinc-300 group-hover:text-white text-sm font-medium truncate">
                                {playlist.name}
                            </span>
                        </Link>
                    )
                })}
            </div>

            {/* Модалка создания плейлиста */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <form
                        onSubmit={handleCreate}
                        className="bg-[#18181b] border border-[#27272a] p-6 rounded-2xl w-full max-w-md flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                    >
                        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                            <h2 className="text-lg font-bold text-white">Создать плейлист</h2>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-zinc-400 hover:text-white text-lg font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex gap-4 items-center">
                            {/* Выбор картинки / Загрузка аватарки плейлиста */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group w-24 h-24 rounded-xl bg-zinc-800/80 border border-dashed border-zinc-600 hover:border-indigo-500 flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden shrink-0 transition-colors"
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <span className="text-2xl">🖼️</span>
                                        <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200">Обложка</span>
                                    </>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] text-white font-medium transition-opacity">
                                    Изменить
                                </div>
                            </div>

                            {/* Поля ввода */}
                            <div className="flex flex-col gap-3 flex-1">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400">Название *</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Rock Playlists"
                                        disabled={isPending}
                                        className="px-3 py-2 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Кнопки */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || !name.trim()}
                                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
                            >
                                {isPending ? 'Создание...' : 'Создать'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}