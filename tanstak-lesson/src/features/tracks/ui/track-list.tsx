import { useState } from 'react'
import { TrackActionsModal } from './track-actions-modal'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { AddToPlaylistModal } from '@/features/playlists-new-my/ui/add-to-playlist-modal'
import { TrackLikeButton } from "@/features/tracks/ui/button/tracks-likes-button.tsx"
import { TrackSkeleton } from "@/shared/ui/track-skeleton.tsx"

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
    enableActions?: boolean
}

const getTrackDisplayInfo = (track: Track) => {
    let displayTitle = track.title
    let displayArtist = track.artist?.trim()

    if (!displayArtist) {
        const separator = track.title.includes(' — ')
            ? ' — '
            : track.title.includes(' - ')
                ? ' - '
                : null

        if (separator) {
            const parts = track.title.split(separator)
            const pTitle = parts[0]?.trim()
            const pArtist = parts[1]?.trim()

            if (pTitle) displayTitle = pTitle
            if (pArtist) displayArtist = pArtist
        }
    }

    return {
        displayTitle,
        displayArtist: displayArtist || track.authorEmail || 'Неизвестный исполнитель'
    }
}

export const TrackList = ({
                              tracks = [],
                              isLoading,
                              emptyMessage = 'Треков пока нет',
                              showAuthor = false,
                              enableActions = false
                          }: TrackListProps) => {
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
    const [playlistTrackId, setPlaylistTrackId] = useState<string | null>(null)

    const { currentTrack, playTrack, closePlayer } = useAudioPlayer()
    const selectedTrack = tracks.find((t) => t._id === selectedTrackId)

    const togglePlay = (track: Track) => {
        if (currentTrack?._id === track._id) {
            closePlayer()
        } else {
            const { displayTitle, displayArtist } = getTrackDisplayInfo(track)
            playTrack(
                {
                    _id: track._id,
                    title: displayTitle,
                    artist: displayArtist,
                    fileUrl: track.fileUrl,
                    coverUrl: track.coverUrl
                },
                tracks
            )
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3.5 max-w-4xl mx-auto w-full">
                {Array.from({ length: 5 }).map((_, index) => (
                    <TrackSkeleton key={index} />
                ))}
            </div>
        )
    }

    if (tracks.length === 0) {
        return (
            <div className="text-center py-10 bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-dashed border-zinc-800">
                <p className="text-sm text-zinc-500">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <>
            {/* 👇 Обернули в контейнер со скроллом и нашим кастомным скроллбаром */}
            <div className="flex flex-col gap-3.5 max-w-4xl mx-auto w-full max-h-[650px] overflow-y-auto custom-scrollbar pr-2">
                {tracks.map((track) => {
                    const isPlaying = currentTrack?._id === track._id
                    const { displayTitle, displayArtist } = getTrackDisplayInfo(track)

                    const coverSrc = track.coverUrl
                        ? track.coverUrl.startsWith('http')
                            ? track.coverUrl
                            : `${MY_API_BASE}${track.coverUrl}`
                        : null

                    return (
                        <div
                            key={track._id}
                            className={`group relative flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl transition-all duration-300 border backdrop-blur-xl ${
                                isPlaying
                                    ? 'bg-zinc-900/90 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] translate-y-[-1px]'
                                    : 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-700/60 hover:bg-zinc-900/50 hover:-translate-y-0.5 shadow-lg'
                            }`}
                        >
                            {/* Главная кнопка воспроизведения с градиентным ховером */}
                            <button
                                type="button"
                                onClick={() => togglePlay(track)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg active:scale-95 cursor-pointer ${
                                    isPlaying
                                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/30'
                                        : 'bg-zinc-900 text-zinc-300 hover:bg-indigo-600 hover:text-white border border-zinc-800 hover:border-indigo-500'
                                }`}
                            >
                                {isPlaying ? (
                                    <span className="text-xs font-bold tracking-widest">❚❚</span>
                                ) : (
                                    <span className="text-xs translate-x-[1px]">▶</span>
                                )}
                            </button>

                            {/* Обложка с легким зумом при наведении на карточку */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center shadow-md relative">
                                {coverSrc ? (
                                    <img
                                        src={coverSrc}
                                        alt={displayTitle}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/default-cover.png'
                                        }}
                                    />
                                ) : (
                                    <span className="text-zinc-600 text-xl">🎵</span>
                                )}
                                {/* Полупрозрачный оверлей на обложке при играющем треке */}
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="flex items-end gap-0.5 h-4">
                                            <span className="w-1 bg-indigo-400 animate-bounce h-full rounded-full" />
                                            <span className="w-1 bg-indigo-400 animate-bounce h-2/3 rounded-full [animation-delay:0.2s]" />
                                            <span className="w-1 bg-indigo-400 animate-bounce h-4/5 rounded-full [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Инфо и автор */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span
                                    onClick={() => enableActions && setSelectedTrackId(track._id)}
                                    className={`text-base sm:text-lg font-semibold truncate transition-colors inline-block ${
                                        enableActions ? 'cursor-pointer hover:text-indigo-400' : ''
                                    } ${isPlaying ? 'text-indigo-400 font-bold' : 'text-zinc-100 group-hover:text-white'}`}
                                    title={enableActions ? 'Нажмите для редактирования' : undefined}
                                >
                                    {displayTitle}
                                </span>

                                <span className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">
                                    {displayArtist}
                                </span>

                                {showAuthor && track.authorEmail && (
                                    <span className="text-[11px] text-zinc-500 truncate mt-1">
                                        Загрузил: <span className="text-zinc-400">{track.authorEmail}</span>
                                    </span>
                                )}
                            </div>

                            {/* Кнопка лайка */}
                            <div className="shrink-0">
                                <TrackLikeButton trackId={track._id} />
                            </div>

                            {/* Кнопка добавления в плейлист */}
                            <button
                                type="button"
                                onClick={() => setPlaylistTrackId(track._id)}
                                title="Добавить в плейлист"
                                className="w-10 h-10 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 flex items-center justify-center border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shrink-0"
                            >
                                ➕
                            </button>
                        </div>
                    )
                })}
            </div>

            {enableActions && selectedTrack && (
                <TrackActionsModal
                    trackId={selectedTrack._id}
                    title={selectedTrack.title}
                    coverUrl={selectedTrack.coverUrl}
                    isOpen={Boolean(selectedTrack)}
                    onClose={() => setSelectedTrackId(null)}
                />
            )}

            {playlistTrackId && (
                <AddToPlaylistModal
                    trackId={playlistTrackId}
                    isOpen={Boolean(playlistTrackId)}
                    onClose={() => setPlaylistTrackId(null)}
                />
            )}
        </>
    )
}