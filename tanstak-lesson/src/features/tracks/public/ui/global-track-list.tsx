import { useAllTracksQuery } from '../api/use-all-tracks-query.ts'
import { useAudioPlayer, type TrackInfo } from '@/shared/ui/lib/audio-player-context.tsx'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const GlobalTrackList = () => {
    const { data: tracks = [], isLoading } = useAllTracksQuery()

    // 2. Достаем глобальное состояние и методы плеера
    const { currentTrack, playTrack, closePlayer } = useAudioPlayer()

    // 3. Функция переключения воспроизведения
    const togglePlay = (track: any) => {
        // Если трек уже играет — выключаем/закрываем
        if (currentTrack?._id === track._id) {
            closePlayer()
            return
        }

        // Форматируем весь список треков под интерфейс TrackInfo для корректной работы плейлиста
        const formattedPlaylist: TrackInfo[] = tracks.map((t: any) => ({
            _id: t._id,
            title: t.title,
            artist: t.authorEmail || 'Неизвестный исполнитель',
            fileUrl: t.fileUrl,
            coverUrl: t.coverUrl,
        }))

        // Находим текущий выбриаемый трек в отформатированном списке
        const targetTrack = formattedPlaylist.find((t) => t._id === track._id)

        if (targetTrack) {
            playTrack(targetTrack, formattedPlaylist)
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
        <div className="space-y-2">
            {tracks.map((track) => {
                // 4. Сравниваем ID трека с глобальным currentTrack
                const isPlaying = currentTrack?._id === track._id
                const coverSrc = track.coverUrl
                    ? track.coverUrl.startsWith('http')
                        ? track.coverUrl
                        : `${MY_API_BASE}${track.coverUrl}`
                    : null

                return (
                    <div
                        key={track._id}
                        className={`flex flex-col gap-2 p-3 rounded-xl transition-colors ${
                            isPlaying ? 'bg-[#27272a]/80 border border-indigo-500/40' : 'bg-[#27272a]/40 hover:bg-[#27272a]/70'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => togglePlay(track)}
                                className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    isPlaying ? 'bg-indigo-500' : 'bg-indigo-600/80 hover:bg-indigo-500'
                                }`}
                            >
                                {isPlaying ? (
                                    <span className="text-xs font-bold">❚❚</span>
                                ) : (
                                    <span className="text-xs translate-x-[1px]">▶</span>
                                )}
                            </button>

                            {coverSrc ? (
                                <img src={coverSrc} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 shrink-0">
                                    🎵
                                </div>
                            )}

                            <div className="flex flex-col min-w-0">
                                <span className={`text-sm font-medium truncate ${isPlaying ? 'text-indigo-400' : 'text-zinc-200'}`}>
                                    {track.title}
                                </span>
                                {track.authorEmail && (
                                    <span className="text-xs text-zinc-500 truncate">{track.authorEmail}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}