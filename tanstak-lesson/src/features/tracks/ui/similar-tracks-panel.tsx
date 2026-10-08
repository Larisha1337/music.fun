import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { useSimilarTracksQuery, type SimilarTrack } from '../api/discover.ts'
import { TrackBadges } from './track-badges.tsx'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

const coverOf = (url?: string | null) =>
    url ? (url.startsWith('http') ? url : `${MY_API_BASE}${url}`) : null

const toInfo = (t: SimilarTrack) => ({
    _id: t._id,
    title: t.title,
    artist: t.artist,
    fileUrl: t.fileUrl || '',
    coverUrl: t.coverUrl,
})

const matchLabel = (t: SimilarTrack) => {
    const parts: string[] = []
    if (t.bpmDiff !== null && t.bpmDiff !== undefined) {
        parts.push(t.bpmDiff <= 2 ? 'тот же темп' : `±${Math.round(t.bpmDiff)} BPM`)
    }
    if (t.keyMatch === 'same') parts.push('та же тональность')
    if (t.keyMatch === 'compatible') parts.push('совместимая тональность')
    return parts.join(' · ')
}

const boxClass =
    'h-full w-full overflow-y-auto custom-scrollbar bg-black/40 rounded-3xl p-2 sm:p-3 border border-white/10 backdrop-blur-2xl shadow-2xl'

export const SimilarTracksPanel = ({ trackId }: { trackId: string }) => {
    const { data, isLoading, isError } = useSimilarTracksQuery(trackId)
    const { currentTrack, playTrack } = useAudioPlayer()

    if (isLoading) {
        return (
            <div className={`${boxClass} flex items-center justify-center text-zinc-300 animate-pulse`}>
                Подбираем похожие треки...
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className={`${boxClass} flex items-center justify-center text-zinc-400 text-center px-6`}>
                Не удалось загрузить похожие треки
            </div>
        )
    }

    if (!data.analyzed) {
        return (
            <div className={`${boxClass} flex items-center justify-center text-zinc-400 text-center px-6`}>
                Для этого трека ещё нет анализа темпа и тональности, поэтому подобрать похожие пока нельзя
            </div>
        )
    }

    if (data.tracks.length === 0) {
        return (
            <div className={`${boxClass} flex items-center justify-center text-zinc-400 text-center px-6`}>
                Похожих треков в библиотеке пока нет
            </div>
        )
    }

    const queue = data.tracks.map(toInfo)

    return (
        <div className={boxClass}>
            <div className="flex flex-col gap-1">
                {data.tracks.map((t, i) => {
                    const cover = coverOf(t.coverUrl)
                    const isCurrent = currentTrack?._id === t._id
                    const label = matchLabel(t)

                    return (
                        <button
                            key={t._id}
                            type="button"
                            onClick={() => playTrack(queue[i]!, queue)}
                            className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-colors cursor-pointer ${
                                isCurrent ? 'bg-white/15' : 'hover:bg-white/10'
                            }`}
                        >
                            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                                {cover ? (
                                    <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm">🎵</span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-300' : 'text-white'}`}>
                                    {t.title}
                                </div>
                                <div className="text-xs text-zinc-400 truncate">{t.artist || 'Неизвестный исполнитель'}</div>
                                {label && <div className="text-[10px] text-emerald-400/90 truncate mt-0.5">{label}</div>}
                            </div>

                            <div className="shrink-0 hidden sm:block">
                                <TrackBadges bpm={t.bpm} musicalKey={t.musicalKey} />
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}