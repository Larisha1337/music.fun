import { useState } from 'react'
import { useMyTracksQuery } from '../api/use-tracks-query'
import { TrackActionsModal } from './track-actions-modal'
// 1. Импортируем наш глобальный контекст!
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const TrackList = () => {
    const { data: tracks = [], isLoading } = useMyTracksQuery()
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

    // 2. Достаем функции из глобального плеера вместо локального useState
    const { currentTrack, playTrack, closePlayer } = useAudioPlayer()

    const selectedTrack = tracks.find((t) => t._id === selectedTrackId)

    // 3. Теперь мы передаем в togglePlay весь объект трека
    const togglePlay = (track: any) => {
        // Если кликаем по треку, который уже играет — ставим на паузу (закрываем)
        if (currentTrack?._id === track._id) {
            closePlayer()
        } else {
            // Иначе отправляем данные трека в наш нижний глобальный плеер
            playTrack({
                _id: track._id,
                title: track.title,
                fileUrl: track.fileUrl,
                coverUrl: track.coverUrl
            })
        }
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
            <div className="flex flex-col gap-4">
                {tracks.map((track) => {
                    // 4. Проверяем, играет ли трек, сравнивая с глобальным currentTrack
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
                                onClick={() => togglePlay(track)} // Передаем сам трек!
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
                                    />
                                ) : (
                                    <span className="text-zinc-500 text-xl">🎵</span>
                                )}
                            </div>

                            {/* Название */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span
                                    onClick={() => setSelectedTrackId(track._id)}
                                    className={`text-lg font-bold truncate cursor-pointer transition-colors inline-block ${
                                        isPlaying ? 'text-indigo-400' : 'text-zinc-100 hover:text-indigo-400'
                                    }`}
                                    title="Нажмите для редактирования"
                                >
                                    {track.title}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Модалка действий */}
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