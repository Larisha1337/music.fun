import { useState } from 'react'
import { TrackActionsModal } from './track-actions-modal'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { AddToPlaylistModal } from '@/features/playlists-new-my/ui/add-to-playlist-modal' // 👈 Наш новый импорт

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
    const [playlistTrackId, setPlaylistTrackId] = useState<string | null>(null) // 👈 Состояние для добавления в плейлист

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
                    const { displayTitle, displayArtist } = getTrackDisplayInfo(track)

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
                                        alt={displayTitle}
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
                                    {displayTitle}
                                </span>

                                <span className="text-sm text-zinc-400 truncate">
                                    {displayArtist}
                                </span>

                                {showAuthor && track.authorEmail && (
                                    <span className="text-xs text-zinc-500 truncate mt-0.5">
                                        Загрузил: {track.authorEmail}
                                    </span>
                                )}
                            </div>

                            {/* 👈 КНОПКА ДОБАВЛЕНИЯ В ПЛЕЙЛИСТ */}
                            <button
                                type="button"
                                onClick={() => setPlaylistTrackId(track._id)}
                                title="Добавить в плейлист"
                                className="w-10 h-10 rounded-xl bg-zinc-800/80 hover:bg-indigo-600 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700 transition-all cursor-pointer shrink-0"
                            >
                                ➕
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Модалка редактирования/удаления моих треков */}
            {enableActions && selectedTrack && (
                <TrackActionsModal
                    trackId={selectedTrack._id}
                    title={selectedTrack.title}
                    coverUrl={selectedTrack.coverUrl}
                    isOpen={Boolean(selectedTrack)}
                    onClose={() => setSelectedTrackId(null)}
                />
            )}

            {/* 👈 Модалка выбора плейлиста */}
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