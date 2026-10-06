// src/routes/playlists/index.tsx (или ваш файл компоновки /playlists)
import { createFileRoute, Outlet, useParams, Link } from '@tanstack/react-router'
import { PlaylistsSidebar } from '@/pages/PlaylistsList.tsx' // проверьте ваш импорт PlaylistsSidebar
import { useState, useRef, useCallback } from 'react'
import { useMyPlaylistsQuery, useCreatePlaylistMutation } from '@/features/playlists-new-my/api/use-playlists-query.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

const getImageUrl = (url?: string | null) => {
    if (!url) return null
    return url.startsWith('http') ? url : `${MY_API_BASE}${url}`
}

export const Route = createFileRoute('/playlists')({
    component: PlaylistsLayout,
})

function PlaylistsLayout() {
    const params = useParams({ strict: false }) as { playlistId?: string }
    const isPlaylistSelected = !!params.playlistId

    const [sidebarWidth, setSidebarWidth] = useState(384)
    const isResizing = useRef(false)

    const { data: playlists, isLoading } = useMyPlaylistsQuery()
    const { mutate: createPlaylist, isPending } = useCreatePlaylistMutation()

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        isResizing.current = true

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return
            const newWidth = moveEvent.clientX
            const minWidth = 260
            const maxWidth = 600
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            isResizing.current = false
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }, [])

    // 1. Когда плейлист НЕ выбран — полноэкранная сетка
    if (!isPlaylistSelected) {
        return (
            <div className="flex flex-col w-full h-[calc(100vh-76px)] bg-[#121212] text-zinc-300 px-8 py-6 overflow-y-auto custom-scrollbar select-none">
                <div className="flex items-center justify-between pb-6 border-b border-[#27272a]/50 mb-6">
                    <div className="flex items-center gap-3 text-white font-bold text-xl">
                        <svg className="w-7 h-7 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134a1 1 0 0 0-1 0l-6 3.5a1 1 0 0 0 0 1.732l6 3.5a1 1 0 0 0 1-.866V3a1 1 0 0 0-.5-.866zM9 13.134a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H9z" />
                        </svg>
                        <span>Моя медиатека</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                        <span className="text-lg leading-none">+</span>
                        <span>Создать плейлист</span>
                    </button>
                </div>

                <div className="flex-1">
                    {isLoading && (
                        <div className="text-zinc-500 text-center py-16">Загрузка плейлистов...</div>
                    )}

                    {!isLoading && playlists?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                            <span className="text-6xl">🎵</span>
                            <p className="text-zinc-400 text-base">У вас пока нет созданных плейлистов</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-6">
                        {playlists?.map((playlist) => {
                            const cover = getImageUrl(playlist.coverUrl)
                            return (
                                <Link
                                    key={playlist._id}
                                    to="/playlists/$playlistId"
                                    params={{ playlistId: playlist._id }}
                                    className="group flex flex-col p-4 bg-[#18181b]/60 hover:bg-[#27272a]/80 border border-[#27272a] hover:border-indigo-500/50 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg"
                                >
                                    <div className="relative w-full aspect-square rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden shadow-inner mb-3.5">
                                        {cover ? (
                                            <img
                                                src={cover}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span className="text-4xl">🎵</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-base font-bold text-zinc-100 group-hover:text-white truncate w-full" title={playlist.name}>
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

    // 2. Когда плейлист ВЫБРАН:
    // На мобилках (hidden md:flex) сайдбар полностью скрыт, а контент с треками занимает всю ширину (w-full).
    // На десктопе включается полноценный сплит с возможностью ресайза.
    return (
        <div className="flex gap-2 px-2 pb-2 w-full h-[calc(100vh-76px)] overflow-hidden select-none">
            <aside
                style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
                className="hidden md:flex shrink-0 h-full flex-col bg-[#121212] rounded-xl border border-[#27272a]/50 overflow-hidden relative transition-all duration-200 w-[var(--sidebar-width)]"
            >
                <PlaylistsSidebar />

                <div
                    onMouseDown={startResizing}
                    className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-10"
                    title="Потяните, чтобы изменить размер"
                />
            </aside>

            <main className="h-full bg-[#121212] rounded-xl border border-[#27272a]/50 overflow-y-auto custom-scrollbar transition-all duration-200 flex flex-col w-full md:flex-1">
                <Outlet />
            </main>
        </div>
    )
}