import { useState } from 'react'
import { Modal } from '@/shared/ui/modal/remove-modal.tsx'
import { toast } from '@/shared/ui/toast.tsx'
import { apiError } from '@/shared/ui/lib/api-error.ts'
import { PlaylistCover } from './playlist-cover.tsx'
import {
    isLikedPlaylist,
    useAddTrackToPlaylistMutation,
    useCreatePlaylistMutation,
    useMyPlaylistsQuery,
    type PlaylistSummary,
} from '../api/use-playlists-query.ts'
import { pluralTracks } from '../lib/format.ts'

type Props = {
    trackId: string
    isOpen: boolean
    onClose: () => void
}

export const AddToPlaylistModal = ({ trackId, isOpen, onClose }: Props) => {
    const { data: playlists = [], isLoading } = useMyPlaylistsQuery()
    const { mutate: addTrack } = useAddTrackToPlaylistMutation()
    const { mutateAsync: createPlaylist, isPending: isCreating } = useCreatePlaylistMutation()

    const [busyId, setBusyId] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [filter, setFilter] = useState('')

    const contains = (p: PlaylistSummary) => (p.tracks ?? []).some((id) => String(id) === trackId)

    const add = (id: string, name: string) => {
        setBusyId(id)
        addTrack(
            { playlistId: id, trackId },
            {
                onSuccess: () => {
                    toast.success(`Добавлено в «${name}»`)
                    onClose()
                },
                onError: (err) => toast.error(apiError(err, 'Не удалось добавить трек')),
                onSettled: () => setBusyId(null),
            }
        )
    }

    const createAndAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        const name = newName.trim()
        if (!name || isCreating) return

        try {
            const fd = new FormData()
            fd.append('name', name)
            const playlist = await createPlaylist(fd)
            setNewName('')
            add(playlist._id, playlist.name)
        } catch (err) {
            toast.error(apiError(err, 'Не удалось создать плейлист'))
        }
    }

    const q = filter.trim().toLowerCase()
    const shown = q ? playlists.filter((p) => p.name.toLowerCase().includes(q)) : playlists

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Добавить в плейлист" maxWidth="max-w-md">
            <div className="flex flex-col gap-4">
                <form onSubmit={createAndAdd} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Новый плейлист..."
                        maxLength={100}
                        disabled={isCreating}
                        aria-label="Название нового плейлиста"
                        className="input-soft min-w-0 flex-1"
                    />
                    <button type="submit" disabled={isCreating || !newName.trim()} className="btn-accent shrink-0">
                        {isCreating ? '...' : 'Создать'}
                    </button>
                </form>

                {playlists.length > 6 && (
                    <input
                        type="search"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Найти плейлист"
                        aria-label="Найти плейлист"
                        className="input-soft"
                    />
                )}

                {isLoading ? (
                    <p className="py-6 text-center text-sm text-zinc-400">Загрузка плейлистов...</p>
                ) : shown.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-500">
                        {playlists.length === 0 ? 'Создайте первый плейлист выше' : 'Ничего не найдено'}
                    </p>
                ) : (
                    <div className="custom-scrollbar flex max-h-[45vh] flex-col gap-1.5 overflow-y-auto pr-1">
                        {shown.map((p) => {
                            const has = contains(p)

                            return (
                                <button
                                    key={p._id}
                                    type="button"
                                    disabled={has || busyId !== null}
                                    onClick={() => add(p._id, p.name)}
                                    className="track-card flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left disabled:cursor-default"
                                >
                                    <PlaylistCover
                                        coverUrl={p.coverUrl}
                                        previewCovers={p.previewCovers}
                                        isSystem={isLikedPlaylist(p)}
                                        className="h-12 w-12 shrink-0 rounded-lg ring-1 ring-pink-200/15"
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-white">{p.name}</span>
                                        <span className="block truncate text-xs text-zinc-400">{pluralTracks(p.tracks?.length ?? 0)}</span>
                                    </span>

                                    {busyId === p._id ? (
                                        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-pink-300" />
                                    ) : has ? (
                                        <span className="shrink-0 rounded-full bg-pink-300/15 px-2.5 py-1 text-[11px] font-bold text-pink-200">
                                            ✓ Уже тут
                                        </span>
                                    ) : (
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-pink-200">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </Modal>
    )
}