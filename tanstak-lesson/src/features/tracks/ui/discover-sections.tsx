import { useRef } from 'react'
import { useMeQuery } from '@/hooks/useMeQuery.ts'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { api } from '@/shared/api/axiosInstance.ts'
import { useRecentTracksQuery, useRecommendedTracksQuery, type DiscoverTrack } from '../api/discover.ts'

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

type CarouselProps = {
    title: string
    tracks: DiscoverTrack[]
    isLoading: boolean
    showReason?: boolean
}

const Carousel = ({ title, tracks, isLoading, showReason = false }: CarouselProps) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const prefetchedRef = useRef<Set<string>>(new Set())
    const { currentTrack, playTrack } = useAudioPlayer()

    if (!isLoading && tracks.length === 0) return null

    const scrollBy = (dir: 1 | -1) => {
        const el = scrollRef.current
        if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
    }

    // Пока мышь над карточкой, сервер готовит аудио (для YouTube-треков без файла)
    const prefetch = (t: DiscoverTrack) => {
        if (t.fileUrl?.trim() || prefetchedRef.current.has(t._id)) return
        prefetchedRef.current.add(t._id)
        api.post(`/tracks/${t._id}/prefetch`).catch(() => prefetchedRef.current.delete(t._id))
    }

    const queue = tracks.map(toInfo)

    return (
        <section className="w-full">
            <div className="flex items-center justify-between mb-2.5 px-1">
                <h3 className="text-sm sm:text-base font-bold text-white">{title}</h3>
                <div className="hidden md:flex items-center gap-1.5">
                    {([-1, 1] as const).map((dir) => (
                        <button
                            key={dir}
                            type="button"
                            onClick={() => scrollBy(dir)}
                            aria-label={dir === -1 ? 'Назад' : 'Вперёд'}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
                        >
                            {dir === -1 ? '‹' : '›'}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-36 sm:w-40 shrink-0 animate-pulse">
                            <div className="aspect-square rounded-xl bg-zinc-800/80" />
                            <div className="h-3 w-3/4 rounded bg-zinc-800/80 mt-2.5" />
                            <div className="h-2.5 w-1/2 rounded bg-zinc-800/50 mt-1.5" />
                        </div>
                    ))
                    : tracks.map((t, i) => {
                        const cover = coverOf(t.coverUrl)
                        const isCurrent = currentTrack?._id === t._id

                        return (
                            <button
                                key={t._id}
                                type="button"
                                onClick={() => playTrack(queue[i]!, queue)}
                                onPointerEnter={() => prefetch(t)}
                                onTouchStart={() => prefetch(t)}
                                title={t.reason}
                                className="group w-36 sm:w-40 shrink-0 snap-start text-left cursor-pointer focus:outline-none"
                            >
                                <div
                                    className={`relative aspect-square rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center border transition-all duration-300 ${
                                        isCurrent
                                            ? 'border-indigo-400/60 shadow-[0_0_24px_rgba(99,102,241,0.35)]'
                                            : 'border-white/5 group-hover:border-white/20'
                                    }`}
                                >
                                    {cover ? (
                                        <img
                                            src={cover}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <span className="text-3xl">🎵</span>
                                    )}

                                    <span
                                        className={`absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs shadow-lg transition-all duration-300 ${
                                            isCurrent
                                                ? 'opacity-100 translate-y-0'
                                                : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
                                        }`}
                                    >
                                        {isCurrent ? '❚❚' : '▶'}
                                    </span>
                                </div>

                                <div className={`mt-2 text-sm font-semibold truncate ${isCurrent ? 'text-indigo-300' : 'text-zinc-100'}`}>
                                    {t.title}
                                </div>
                                <div className="text-xs text-zinc-400 truncate">{t.artist || 'Неизвестный исполнитель'}</div>
                                {showReason && t.reason && (
                                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{t.reason}</div>
                                )}
                            </button>
                        )
                    })}
            </div>
        </section>
    )
}

export const DiscoverSections = () => {
    const { data: user } = useMeQuery()
    const enabled = Boolean(user)

    const recent = useRecentTracksQuery(enabled)
    const recommended = useRecommendedTracksQuery(enabled)

    if (!enabled) return null

    return (
        <div className="w-full flex flex-col gap-6">
            <Carousel title="Недавно играло" tracks={recent.data ?? []} isLoading={recent.isLoading} />
            <Carousel title="Для вас" tracks={recommended.data ?? []} isLoading={recommended.isLoading} showReason />
        </div>
    )
}