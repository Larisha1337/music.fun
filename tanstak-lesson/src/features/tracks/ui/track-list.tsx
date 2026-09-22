import { useState } from 'react'
import { TrackActionsModal } from './track-actions-modal'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export type Track = {
    _id: string
    title: string
    fileUrl: string
    coverUrl?: string | null
    artist?: string
    authorEmail?: string
}

interface TrackListProps {
    tracks: Track[]
    isLoading: boolean
    emptyMessage?: string
    showAuthor?: boolean
    enableActions?: boolean // true для "Моих треков", false для "Глобальной ленты"
}

export const TrackList = ({
                              tracks = [],
                              isLoading,
                              emptyMessage = 'Треков пока нет',
                              showAuthor = false,
                              enableActions = false
                          }: TrackListProps) => {
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
    const { currentTrack, playTrack, closePlayer } = useAudioPlayer()

    const selectedTrack = tracks.find((t) => t._id === selectedTrackId)

    const togglePlay = (track: Track) => {
        if (currentTrack?._id === track._id) {
            closePlayer()
        } else {
            playTrack(
                {
                    _id: track._id,
                    title: track.title,
                    artist: track.artist || track.authorEmail || 'Неизвестный исполнитель',
                    fileUrl: track.fileUrl,
                    coverUrl: track.coverUrl
                },
                tracks
            )
        }
    }

    if (isLoading) {
        return <p className="text-xs text-zinc-500 text-center py-4">Загрузка треков...</p>
    }

    if (tracks.length === 0) {
        return (
            <div className="text-center py-6 bg-[#27272a]/20 rounded-xl border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-500">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {tracks.map((track) => {
                    const isPlaying = currentTrack?._id === track._id
                    const coverSrc = track.coverUrl
                        ? track.coverUrl.startsWith('http')
                            ? track.coverUrl
                            : `${MY_API_BASE}${track.coverUrl}`
                        : null

                    return (
                        <div
                            key={track._id}
                            className={`flex items-center gap-4 p-4 hover:bg-[#27272a]/60 border rounded-2xl transition-all shadow-md group ${
                                isPlaying ? 'bg-[#27272a]/40 border-indigo-500/50' : 'bg-[#18181b]/90 border-[#27272a]'
                            }`}
                        >
                            {/* Главная кнопка воспроизведения */}
                            <button
                                type="button"
                                onClick={() => togglePlay(track)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95 cursor-pointer ${
                                    isPlaying
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-indigo-600 hover:text-white border border-zinc-700'
                                }`}
                            >
                                {isPlaying ? (
                                    <span className="text-[10px] font-bold">❚❚</span>
                                ) : (
                                    <span className="text-[10px] translate-x-[1px]">▶</span>
                                )}
                            </button>

                            {/* Обложка */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-[#27272a] flex items-center justify-center shadow-sm">
                                {coverSrc ? (
                                    <img
                                        src={coverSrc}
                                        alt={track.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/default-cover.png'
                                        }}
                                    />
                                ) : (
                                    <span className="text-zinc-500 text-xl">🎵</span>
                                )}
                            </div>

                            {/* Инфо и автор */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span
                                    onClick={() => enableActions && setSelectedTrackId(track._id)}
                                    className={`text-lg font-bold truncate transition-colors inline-block ${
                                        enableActions ? 'cursor-pointer hover:text-indigo-400' : ''
                                    } ${isPlaying ? 'text-indigo-400' : 'text-zinc-100'}`}
                                    title={enableActions ? 'Нажмите для редактирования' : undefined}
                                >
                                    {track.title}
                                </span>
                                {showAuthor && track.authorEmail && (
                                    <span className="text-xs text-zinc-400 truncate mt-0.5">
                                        {track.authorEmail}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Модалка действий только для своих треков */}
            {enableActions && selectedTrack && (
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