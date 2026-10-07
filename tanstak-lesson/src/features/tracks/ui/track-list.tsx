import { useState, useRef } from 'react'
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

    // Подгружаем аудио в кэш, пока пользователь тянется к кнопке Play
    const prefetchedRef = useRef<Set<string>>(new Set())
    const hoverTimerRef = useRef<number | null>(null)

    const prefetchTrack = (track: Track) => {
        // у своих загруженных треков есть fileUrl, они и так грузятся из R2
        if (track.fileUrl?.trim()) return
        if (prefetchedRef.current.has(track._id)) return

        prefetchedRef.current.add(track._id)
        fetch(`${MY_API_BASE}/api/tracks/${track._id}/prefetch`, { method: 'POST' }).catch(() => {
            prefetchedRef.current.delete(track._id)
        })
    }

    // Небольшая задержка, чтобы пролёт мышью по списку не запускал десятки загрузок
    const onPlayHoverStart = (track: Track) => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = window.setTimeout(() => prefetchTrack(track), 250)
    }

    const onPlayHoverEnd = () => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
    }

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
            <div className="flex flex-col gap-2.5 sm:gap-3.5 max-w-4xl mx-auto w-full">
                {Array.from({ length: 5 }).map((_, index) => (
                    <TrackSkeleton key={index} />
                ))}
            </div>
        )
    }

    if (tracks.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-dashed border-zinc-800">
                <p className="text-sm text-zinc-500">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <>
            {/* Внутренний скролл только на больших экранах, на телефоне и планшете скроллится страница.
                Нижний отступ нужен, чтобы последний трек не прятался под фиксированным плеером. */}
            <div
                className={`flex flex-col gap-2.5 sm:gap-3.5 max-w-4xl mx-auto w-full lg:max-h-[70vh] lg:overflow-y-auto lg:pr-2 custom-scrollbar ${
                    currentTrack ? 'pb-28 sm:pb-24' : 'pb-2'
                }`}
            >
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
                            className={`group relative flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 border backdrop-blur-xl ${
                                isPlaying
                                    ? 'bg-zinc-900/90 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] translate-y-[-1px]'
                                    : 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-700/60 hover:bg-zinc-900/50 [@media(hover:hover)]:hover:-translate-y-0.5 shadow-lg'
                            }`}
                        >
                            {/* Кнопка воспроизведения */}
                            <button
                                type="button"
                                onClick={() => togglePlay(track)}
                                onPointerEnter={() => onPlayHoverStart(track)}
                                onPointerLeave={onPlayHoverEnd}
                                onTouchStart={() => prefetchTrack(track)}
                                onFocus={() => prefetchTrack(track)}
                                aria-label={isPlaying ? `Остановить: ${displayTitle}` : `Воспроизвести: ${displayTitle}`}
                                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                                    isPlaying
                                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/30'
                                        : 'bg-zinc-900 text-zinc-300 hover:bg-indigo-600 hover:text-white border border-zinc-800 hover:border-indigo-500'
                                }`}
                            >
                                {isPlaying ? (
                                    <span className="text-[10px] sm:text-xs font-bold tracking-widest">❚❚</span>
                                ) : (
                                    <span className="text-[10px] sm:text-xs translate-x-[1px]">▶</span>
                                )}
                            </button>

                            {/* Обложка: тоже кликабельна, удобно тапать пальцем */}
                            <div
                                onClick={() => togglePlay(track)}
                                className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center shadow-md relative cursor-pointer"
                            >
                                {coverSrc ? (
                                    <img
                                        src={coverSrc}
                                        alt={displayTitle}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            const img = e.currentTarget
                                            img.onerror = null // защита от бесконечного цикла, если заглушки нет
                                            img.src = '/default-cover.png'
                                        }}
                                    />
                                ) : (
                                    <span className="text-zinc-600 text-lg sm:text-xl">🎵</span>
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="flex items-end gap-0.5 h-3 sm:h-4">
                                            <span className="w-1 bg-indigo-400 animate-bounce h-full rounded-full" />
                                            <span className="w-1 bg-indigo-400 animate-bounce h-2/3 rounded-full [animation-delay:0.2s]" />
                                            <span className="w-1 bg-indigo-400 animate-bounce h-4/5 rounded-full [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Инфо */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span
                                    onClick={() => enableActions && setSelectedTrackId(track._id)}
                                    className={`text-sm sm:text-lg font-semibold truncate transition-colors block ${
                                        enableActions ? 'cursor-pointer hover:text-indigo-400' : ''
                                    } ${isPlaying ? 'text-indigo-400 font-bold' : 'text-zinc-100 group-hover:text-white'}`}
                                    title={enableActions ? 'Нажмите для редактирования' : displayTitle}
                                >
                                    {displayTitle}
                                </span>

                                <span className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">
                                    {displayArtist}
                                </span>

                                {showAuthor && track.authorEmail && (
                                    <span className="text-[10px] sm:text-[11px] text-zinc-500 truncate mt-0.5 sm:mt-1">
                                        Загрузил: <span className="text-zinc-400">{track.authorEmail}</span>
                                    </span>
                                )}
                            </div>

                            {/* Лайк */}
                            <div className="shrink-0">
                                <TrackLikeButton trackId={track._id} />
                            </div>

                            {/* Добавить в плейлист */}
                            <button
                                type="button"
                                onClick={() => setPlaylistTrackId(track._id)}
                                title="Добавить в плейлист"
                                aria-label={`Добавить в плейлист: ${displayTitle}`}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 flex items-center justify-center text-sm sm:text-base border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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