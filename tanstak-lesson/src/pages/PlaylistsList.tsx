// src/features/playlists-new-my/ui/playlists-sidebar.tsx
import { useState, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
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

    const params = useParams({ strict: false }) as { playlistId?: string }
    const isPlaylistSelected = !!params.playlistId

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
        <div className="flex flex-col h-full bg-[#121212] text-zinc-300 w-full overflow-hidden">
            {/* Шапка медиатеки */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-2.5 text-zinc-200 font-bold text-base hover:text-white transition-colors cursor-pointer">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134a1 1 0 0 0-1 0l-6 3.5a1 1 0 0 0 0 1.732l6 3.5a1 1 0 0 0 1-.866V3a1 1 0 0 0-.5-.866zM9 13.134a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H9z" />
                    </svg>
                    <span>Моя медиатека</span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-[#2a2a2a] transition-all cursor-pointer"
                    title="Создать плейлист"
                >
                    <span className="text-2xl font-light leading-none">+</span>
                </button>
            </div>

            {/* Фильтры */}
            <div className="px-6 py-2 flex gap-2">
                <button className="px-3.5 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-white text-xs font-medium rounded-full transition-colors">
                    Плейлисты
                </button>
            </div>

            {/* Содержимое (сетка на полный экран или список в сайдбаре) */}
            <div className="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar">
                {isLoading && (
                    <div className="text-zinc-500 text-sm py-8 text-center">Загрузка плейлистов...</div>
                )}

                {!isLoading && playlists?.length === 0 && (
                    <div className="text-zinc-500 text-sm py-8 text-center">У вас пока нет плейлистов</div>
                )}

                {!isPlaylistSelected ? (
                    /* Полноэкранная крупная сетка карточек, когда плейлист не выбран */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-6">
                        {playlists?.map((playlist) => {
                            const cover = getImageUrl(playlist.coverUrl)

                            return (
                                <Link
                                    key={playlist._id}
                                    to="/playlists/$playlistId"
                                    params={{ playlistId: playlist._id }}
                                    className="group flex flex-col p-4 bg-[#18181b]/60 hover:bg-[#27272a]/70 border border-transparent hover:border-[#3f3f46] rounded-2xl transition-all duration-300 cursor-pointer shadow-md"
                                >
                                    <div className="relative w-full aspect-square rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden shadow-inner mb-3">
                                        {cover ? (
                                            <img
                                                src={cover}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span className="text-3xl">🎵</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-zinc-100 group-hover:text-white truncate w-full" title={playlist.name}>
                                            {playlist.name}
                                        </span>
                                        <span className="text-xs text-zinc-400 truncate mt-1">
                                            Плейлист • {playlist.tracks?.length || 0} треков
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    /* Увеличенный вертикальный список для сайдбара с квадратными обложками */
                    <div className="flex flex-col gap-2 px-1">
                        {playlists?.map((playlist) => {
                            const cover = getImageUrl(playlist.coverUrl)
                            const isActive = params.playlistId === playlist._id

                            return (
                                <Link
                                    key={playlist._id}
                                    to="/playlists/$playlistId"
                                    params={{ playlistId: playlist._id }}
                                    className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${
                                        isActive
                                            ? 'bg-[#27272a]/90 text-white shadow-md border border-zinc-600/50'
                                            : 'hover:bg-[#1a1a1a] text-zinc-400 hover:text-zinc-200 border border-transparent'
                                    }`}
                                >
                                    {/* Крупная и строго квадратная обложка (никаких кругов) */}
                                    <div className="w-16 h-16 rounded-md bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 shadow">
                                        {cover ? (
                                            <img
                                                src={cover}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span className="text-xl">🎵</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className={`text-sm truncate w-full ${isActive ? 'text-white font-semibold' : 'text-zinc-200 font-medium'}`} title={playlist.name}>
                                            {playlist.name}
                                        </span>
                                        <span className="text-xs text-zinc-400 truncate mt-1">
                                            Плейлист • {playlist.tracks?.length || 0} треков
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Модальное окно создания */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <form
                        onSubmit={handleCreate}
                        className="bg-[#18181b] border border-[#27272a] p-6 rounded-2xl w-full max-w-md flex flex-col gap-5 shadow-2xl"
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group w-24 h-24 rounded-xl bg-zinc-800 border border-dashed border-zinc-600 hover:border-indigo-500 flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden shrink-0 transition-colors"
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <span className="text-2xl">🖼</span>
                                        <span className="text-[10px] text-zinc-400">Обложка</span>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 flex-1">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400">Название *</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Мой плейлист"
                                        disabled={isPending}
                                        className="px-3 py-2 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || !name.trim()}
                                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
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