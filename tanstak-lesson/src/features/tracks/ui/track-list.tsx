import { useEffect, useRef, useState } from 'react'
import { TrackActionsModal } from './track-actions-modal'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { AddToPlaylistModal } from '@/features/playlists-new-my/ui/add-to-playlist-modal'
import { TrackLikeButton } from "@/features/tracks/ui/button/tracks-likes-button.tsx"
import { TrackSkeleton } from "@/shared/ui/track-skeleton.tsx"
import { PlayIcon, PauseIcon } from '@/shared/ui/icons/player-icons'
import { TrackBadges } from './track-badges.tsx'
import { api } from '@/shared/api/axiosInstance.ts'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export type Track = {
    _id: string
    title: string
    fileUrl: string
    coverUrl?: string | null
    artist?: string
    authorEmail?: string
    bpm?: number | null
    musicalKey?: string | null
}

interface TrackListProps {
    tracks: Track[]
    isLoading: boolean
    emptyMessage?: string
    showAuthor?: boolean
    enableActions?: boolean
    /** Постраничная подгрузка: когда список докручен до конца, вызывается onLoadMore */
    hasMore?: boolean
    isFetchingMore?: boolean
    onLoadMore?: () => void
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
                              enableActions = false,
                              hasMore = false,
                              isFetchingMore = false,
                              onLoadMore
                          }: TrackListProps) => {
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
    const [playlistTrackId, setPlaylistTrackId] = useState<string | null>(null)
    const [queuedId, setQueuedId] = useState<string | null>(null)

    const { currentTrack, playTrack, closePlayer, playNextTrack } = useAudioPlayer()
    const selectedTrack = tracks.find((t) => t._id === selectedTrackId)

    // Подгружаем аудио в кэш, пока пользователь тянется к кнопке Play (только для вошедших)
    const prefetchedRef = useRef<Set<string>>(new Set())
    const hoverTimerRef = useRef<number | null>(null)

    const prefetchTrack = (track: Track) => {
        if (track.fileUrl?.trim()) return
        if (prefetchedRef.current.has(track._id)) return
        if (!localStorage.getItem(localStorageKey.accessToken)) return

        prefetchedRef.current.add(track._id)
        api.post(`/tracks/${track._id}/prefetch`).catch(() => {
            prefetchedRef.current.delete(track._id)
        })
    }

    const onPlayHoverStart = (track: Track) => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = window.setTimeout(() => prefetchTrack(track), 250)
    }

    const onPlayHoverEnd = () => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
    }

    // Бесконечная прокрутка: следим за пустым блоком в конце списка
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = sentinelRef.current
        if (!el || !hasMore || !onLoadMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) onLoadMore()
            },
            { rootMargin: '400px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [hasMore, onLoadMore, tracks.length])

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

    const handlePlayNext = (track: Track) => {
        const { displayTitle, displayArtist } = getTrackDisplayInfo(track)
        playNextTrack({
            _id: track._id,
            title: displayTitle,
            artist: displayArtist,
            fileUrl: track.fileUrl,
            coverUrl: track.coverUrl
        })
        setQueuedId(track._id)
        window.setTimeout(() => setQueuedId((id) => (id === track._id ? null : id)), 1200)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2.5 sm:gap-3 max-w-4xl mx-auto w-full">
                {Array.from({ length: 5 }).map((_, index) => (
                    <TrackSkeleton key={index} />
                ))}
            </div>
        )
    }

    if (tracks.length === 0) {
        return (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-pink-200/15 bg-pink-300/[0.03]">
                <p className="text-sm text-zinc-400">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <>
            {/* Нижний отступ нужен, чтобы последний трек не прятался под фиксированным плеером */}
            <div
                className={`flex flex-col gap-2.5 sm:gap-3 max-w-4xl mx-auto w-full ${
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
                            data-active={isPlaying}
                            className="track-card group relative flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl"
                        >
                            {/* Кнопка воспроизведения: как «Слушать», только круглая */}
                            <button
                                type="button"
                                onClick={() => togglePlay(track)}
                                onPointerEnter={() => onPlayHoverStart(track)}
                                onPointerLeave={onPlayHoverEnd}
                                onTouchStart={() => prefetchTrack(track)}
                                onFocus={() => prefetchTrack(track)}
                                aria-label={isPlaying ? `Остановить: ${displayTitle}` : `Воспроизвести: ${displayTitle}`}
                                className={`grid place-items-center shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${
                                    isPlaying
                                        ? 'bg-pink-300 text-zinc-950 shadow-[0_6px_22px_-6px_rgba(255,159,214,0.85)]'
                                        : 'bg-white/10 text-white hover:bg-pink-300 hover:text-zinc-950'
                                }`}
                            >
                                {isPlaying ? (
                                    <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                ) : (
                                    <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 translate-x-px" />
                                )}
                            </button>

                            {/* Обложка: тонкий розовый ободок, чтобы чёрные обложки не сливались с фоном */}
                            <div
                                onClick={() => togglePlay(track)}
                                className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-pink-300/[0.06] ring-1 ring-pink-200/15 flex items-center justify-center shadow-md relative cursor-pointer"
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
                                            img.onerror = null
                                            img.src = '/default-cover.png'
                                        }}
                                    />
                                ) : (
                                    <span className="text-pink-200/60 text-lg sm:text-xl">🎵</span>
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-pink-950/35 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="flex items-end gap-0.5 h-3 sm:h-4">
                                            <span className="w-1 bg-pink-300 animate-bounce h-full rounded-full" />
                                            <span className="w-1 bg-pink-300 animate-bounce h-2/3 rounded-full [animation-delay:0.2s]" />
                                            <span className="w-1 bg-pink-300 animate-bounce h-4/5 rounded-full [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Инфо */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span
                                    onClick={() => enableActions && setSelectedTrackId(track._id)}
                                    className={`text-sm sm:text-lg font-bold truncate transition-colors block ${
                                        enableActions ? 'cursor-pointer hover:text-pink-300' : ''
                                    } ${isPlaying ? 'text-pink-300' : 'text-zinc-100 group-hover:text-white'}`}
                                    title={enableActions ? 'Нажмите для редактирования' : displayTitle}
                                >
                                    {displayTitle}
                                </span>

                                <span className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">
                                    {displayArtist}
                                </span>

                                <TrackBadges bpm={track.bpm} musicalKey={track.musicalKey} />

                                {showAuthor && track.authorEmail && (
                                    <span className="text-[10px] sm:text-[11px] text-zinc-500 truncate mt-0.5 sm:mt-1">
                                        Загрузил: <span className="text-zinc-400">{track.authorEmail}</span>
                                    </span>
                                )}
                            </div>

                            {/* Лайк (с лепестками) */}
                            <TrackLikeButton trackId={track._id} />

                            {/* Играть следующим (на телефоне скрыто) */}
                            <button
                                type="button"
                                onClick={() => handlePlayNext(track)}
                                title="Играть следующим"
                                aria-label={`Играть следующим: ${displayTitle}`}
                                className="icon-btn hidden sm:grid"
                            >
                                {queuedId === track._id ? (
                                    <span className="text-pink-300 text-sm font-bold">✓</span>
                                ) : (
                                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7m6-4v6m-3-3h6" />
                                    </svg>
                                )}
                            </button>

                            {/* Добавить в плейлист */}
                            <button
                                type="button"
                                onClick={() => setPlaylistTrackId(track._id)}
                                title="Добавить в плейлист"
                                aria-label={`Добавить в плейлист: ${displayTitle}`}
                                className="icon-btn grid"
                            >
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                        </div>
                    )
                })}

                {/* Конец списка: когда он появляется на экране, подгружается следующая страница */}
                {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px shrink-0" />}

                {isFetchingMore && (
                    <div className="flex justify-center py-3 shrink-0">
                        <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-pink-300 animate-spin" />
                    </div>
                )}
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