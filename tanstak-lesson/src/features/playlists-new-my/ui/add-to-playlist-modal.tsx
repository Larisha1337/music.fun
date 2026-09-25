import { useState } from 'react'
import { useMyPlaylistsQuery, useAddTrackToPlaylistMutation } from '../api/use-playlists-query'

type Props = {
    trackId: string
    isOpen: boolean
    onClose: () => void
}

export const AddToPlaylistModal = ({ trackId, isOpen, onClose }: Props) => {
    const { data: playlists = [], isLoading } = useMyPlaylistsQuery()
    const { mutate: addTrack, isPending } = useAddTrackToPlaylistMutation()
    const [addedId, setAddedId] = useState<string | null>(null)

    if (!isOpen) return null

    const handleAdd = (playlistId: string) => {
        addTrack(
            { playlistId, trackId },
            {
                onSuccess: () => {
                    setAddedId(playlistId)
                    setTimeout(() => {
                        setAddedId(null)
                        onClose()
                    }, 1000)
                }
            }
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-3xl p-6 shadow-2xl text-zinc-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white font-bold cursor-pointer"
                >
                    ✕
                </button>

                <h3 className="text-lg font-bold mb-4">Добавить в плейлист</h3>

                {isLoading ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">Загрузка плейлистов...</p>
                ) : playlists.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">У вас пока нет плейлистов</p>
                ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                        {playlists.map((pl) => (
                            <button
                                key={pl._id}
                                disabled={isPending}
                                onClick={() => handleAdd(pl._id)}
                                className="flex items-center justify-between w-full p-3 bg-[#27272a]/40 hover:bg-[#27272a] border border-[#27272a] rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
                            >
                                <span className="font-medium text-sm truncate">{pl.name}</span>
                                {addedId === pl._id && (
                                    <span className="text-emerald-400 text-xs font-bold">Добавлено ✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}