import { useEffect, useMemo, useState } from 'react'
import { useMeQuery } from '@/hooks/useMeQuery.ts'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { useRecommendedTracksQuery, type DiscoverTrack } from '../api/discover.ts'
import { useInfiniteTracksQuery } from '../api/use-infinite-tracks-query.ts'
import { TrackLikeButton } from './button/tracks-likes-button.tsx'
import { TrackBadges } from './track-badges.tsx'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

const coverOf = (url?: string | null) =>
    url ? (url.startsWith('http') ? url : `${MY_API_BASE}${url}`) : null

const toInfo = (t: DiscoverTrack) => ({
    _id: t._id,
    title: t.title,
    artist: t.artist,
    fileUrl: t.fileUrl || '',
    coverUrl: t.coverUrl,
})

export const Hero = () => {
    const { data: user } = useMeQuery()
    const recommended = useRecommendedTracksQuery(Boolean(user))
    // Тот же запрос, что у основной ленты: лишней нагрузки на сервер нет
    const newest = useInfiniteTracksQuery({ q: '', sort: 'new', key: '' })
    const { currentTrack, playTrack } = useAudioPlayer()

    const slides = useMemo<DiscoverTrack[]>(() => {
        const rec = recommended.data ?? []
        const fresh = newest.data?.pages[0]?.tracks ?? []
        return (rec.length >= 3 ? rec : fresh).slice(0, 6)
    }, [recommended.data, newest.data])

    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        if (paused || slides.length < 2) return
        const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 8000)
        return () => window.clearInterval(id)
    }, [paused, slides.length])

    if (slides.length === 0) {
        return newest.isPending ? (
            <div className="h-60 sm:h-72 rounded-3xl bg-white/[0.04] animate-pulse" />
        ) : null
    }

    const current = index % slides.length
    const track = slides[current]!
    const cover = coverOf(track.coverUrl)
    const queue = slides.map(toInfo)
    const isCurrent = currentTrack?._id === track._id
    const go = (dir: 1 | -1) => setIndex((i) => (i + dir + slides.length) % slides.length)

    return (
        <section
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60"
        >
            {cover && (
                <img
                    key={`bg-${track._id}`}
                    src={cover}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl opacity-40 animate-fade-in"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-zinc-950/20" />

            <div
                key={track._id}
                className="relative flex items-center gap-6 min-h-60 sm:min-h-72 p-5 sm:p-8 pb-14 animate-fade-in"
            >
                <div className="flex flex-col gap-3 min-w-0 flex-1">
                    <span className="chip self-start">{track.reason ?? 'Новое в библиотеке'}</span>

                    <h2 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight text-white line-clamp-2">
                        {track.title}
                    </h2>
                    <p className="text-sm sm:text-base font-medium text-zinc-300 truncate">
                        {track.artist || 'Неизвестный исполнитель'}
                    </p>

                    <TrackBadges bpm={track.bpm} musicalKey={track.musicalKey} />

                    <div className="flex items-center gap-2.5 mt-1">
                        <button type="button" onClick={() => playTrack(queue[current]!, queue)} className="btn-accent">
                            {isCurrent ? '❚❚ Играет' : '▶ Слушать'}
                        </button>
                        {user && <TrackLikeButton trackId={track._id} />}
                    </div>
                </div>

                {cover && (
                    <img
                        src={cover}
                        alt={track.title}
                        className="hidden sm:block h-40 w-40 lg:h-52 lg:w-52 shrink-0 rounded-2xl object-cover shadow-2xl rotate-3"
                    />
                )}
            </div>

            {slides.length > 1 && (
                <div className="absolute bottom-4 right-4 sm:right-6 flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 mr-1">
                        {slides.map((s, i) => (
                            <button
                                key={s._id}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Слайд ${i + 1}`}
                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                    i === current ? 'w-6 bg-pink-300' : 'w-2 bg-white/25 hover:bg-white/40'
                                }`}
                            />
                        ))}
                    </div>
                    {([-1, 1] as const).map((dir) => (
                        <button
                            key={dir}
                            type="button"
                            onClick={() => go(dir)}
                            aria-label={dir === -1 ? 'Предыдущий' : 'Следующий'}
                            className="grid place-items-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
                        >
                            {dir === -1 ? '‹' : '›'}
                        </button>
                    ))}
                </div>
            )}
        </section>
    )
}