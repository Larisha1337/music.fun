import { useState } from 'react'
import { useMyTracksQuery } from '../api/use-tracks-query.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const TrackList = () => {
    const { data: tracks = [], isLoading } = useMyTracksQuery()
    const [playingId, setPlayingId] = useState<string | null>(null)

    const togglePlay = (id: string) => {
        setPlayingId((prev) => (prev === id ? null : id))
    }

    if (isLoading) {
        return <p className="text-xs text-zinc-500 text-center py-4">Загрузка треков...</p>
    }

    if (tracks.length === 0) {
        return (
            <div className="text-center py-6 bg-[#27272a]/20 rounded-xl border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-500">Треков пока нет</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {tracks.map((track) => {
                const isPlaying = playingId === track._id
                const audioSrc = `${MY_API_BASE}${track.fileUrl}`

                return (
                    <div
                        key={track._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#27272a]/40 hover:bg-[#27272a]/70 rounded-xl transition-colors"
                    >
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => togglePlay(track._id)}
                                className="w-8 h-8 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
                            >
                                {isPlaying ? <span className="text-xs">❚❚</span> : <span className="text-xs translate-x-[1px]">▶</span>}
                            </button>

                            <span className="text-sm font-medium text-zinc-200 truncate">
                {track.title}
              </span>
                        </div>

                        {isPlaying && (
                            <audio
                                src={audioSrc}
                                controls
                                autoPlay
                                onEnded={() => setPlayingId(null)}
                                className="h-8 w-full sm:w-64 max-w-full rounded-lg"
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}