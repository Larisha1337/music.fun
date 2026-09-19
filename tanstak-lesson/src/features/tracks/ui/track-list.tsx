import { useState } from 'react'
import { useMyTracksQuery } from '../api/use-tracks-query.ts'
import { TrackActionsModal } from './track-actions-modal.tsx'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const TrackList = () => {
    const { data: tracks = [], isLoading } = useMyTracksQuery()
    const [playingId, setPlayingId] = useState<string | null>(null)

    // Храним только ID выделенного трека
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

    // Всегда находим актуальный трек из React Query
    const selectedTrack = tracks.find((t) => t._id === selectedTrackId)

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
        <>
            <div className="flex flex-col gap-3.5">
                {tracks.map((track) => {
                    const isPlaying = playingId === track._id
                    const audioSrc = `${MY_API_BASE}${track.fileUrl}`
                    const coverSrc = track.coverUrl
                        ? track.coverUrl.startsWith('http')
                            ? track.coverUrl
                            : `${MY_API_BASE}${track.coverUrl}`
                        : null

                    return (
                        <div
                            key={track._id}
                            className="flex flex-col gap-3 p-3.5 bg-[#18181b]/80 hover:bg-[#27272a]/80 border border-[#27272a] rounded-2xl transition-all shadow-md"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => togglePlay(track._id)}
                                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95"
                                >
                                    {isPlaying ? <span className="text-xs font-bold">❚❚</span> : <span className="text-xs translate-x-[1px]">▶</span>}
                                </button>

                                {/* Компактная обложка в списке */}
                                <div className="w-40 h-40 rounded-xl overflow-hidden shrink-0 bg-[#27272a] border border-zinc-700/50 flex items-center justify-center shadow-sm">
                                    {coverSrc ? (
                                        <img
                                            src={coverSrc}
                                            alt={track.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-zinc-500 text-base">🎵</span>
                                    )}
                                </div>

                                <span
                                    onClick={() => setSelectedTrackId(track._id)}
                                    className="text-base font-semibold text-zinc-100 truncate cursor-pointer hover:text-indigo-400 transition-colors flex-1"
                                >
                                    {track.title}
                                </span>
                            </div>

                            {isPlaying && (
                                <audio
                                    src={audioSrc}
                                    controls
                                    autoPlay
                                    onEnded={() => setPlayingId(null)}
                                    className="h-9 w-full rounded-xl pt-1"
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {selectedTrack && (
                <TrackActionsModal
                    trackId={selectedTrack._id}
                    title={selectedTrack.title}
                    coverUrl={selectedTrack.coverUrl}
                    isOpen={Boolean(selectedTrack)}
                    onClose={() => setSelectedTrackId(null)}
                />
            )}
        </>
    )
}