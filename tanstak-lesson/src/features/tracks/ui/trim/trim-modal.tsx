import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { isAxiosError } from 'axios'
import { useAudioPlayer, type TrackInfo } from '@/shared/ui/lib/audio-player-context.tsx'
import { clearTrim, getTrim, setTrim } from '@/shared/ui/lib/trim-store.ts'
import { useTrackPeaksQuery } from '@/shared/api/use-track-peaks-query.ts'
import { useTrimTrackMutation } from '../../../../shared/tracks/api/trim.ts'
import { addSegment, MAX_SEGMENTS, openCompose, useCompose } from '@/shared/ui/lib/compose-store.ts'

const MIN_LEN = 1
const FLAT_BARS = Array.from({ length: 120 }, () => 0.35)

const round1 = (n: number) => Math.round(n * 10) / 10
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

const fmtPrecise = (t: number) => {
    const m = Math.floor(t / 60)
    const s = t - m * 60
    return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

const getAudio = () => document.querySelector('audio')

/** Длительность и позиция играющего трека (читаем из <audio> плеера) */
const useAudioInfo = () => {
    const [info, setInfo] = useState({ duration: 0, currentTime: 0 })

    useEffect(() => {
        const read = () => {
            const audio = getAudio()
            if (!audio) return
            const duration = Number.isFinite(audio.duration) ? audio.duration : 0
            setInfo((prev) =>
                prev.duration === duration && Math.abs(prev.currentTime - audio.currentTime) < 0.05
                    ? prev
                    : { duration, currentTime: audio.currentTime }
            )
        }

        read()
        const id = window.setInterval(read, 200)
        return () => window.clearInterval(id)
    }, [])

    return info
}

const Nudge = ({
                   onClick,
                   disabled,
                   children,
               }: {
    onClick: () => void
    disabled?: boolean
    children: React.ReactNode
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
        {children}
    </button>
)

type HandleCardProps = {
    label: string
    value: number
    now: number
    disabled: boolean
    onChange: (v: number) => void
}

const HandleCard = ({ label, value, now, disabled, onChange }: HandleCardProps) => (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="font-mono text-sm text-indigo-200">{fmtPrecise(value)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
            <Nudge disabled={disabled} onClick={() => onChange(value - 1)}>−1с</Nudge>
            <Nudge disabled={disabled} onClick={() => onChange(value - 0.1)}>−0,1</Nudge>
            <Nudge disabled={disabled} onClick={() => onChange(value + 0.1)}>+0,1</Nudge>
            <Nudge disabled={disabled} onClick={() => onChange(value + 1)}>+1с</Nudge>
            <Nudge disabled={disabled} onClick={() => onChange(now)}>⌖ Сейчас</Nudge>
        </div>
    </div>
)

type Props = {
    track: TrackInfo
    onClose: () => void
}

// Рендерится только пока окно открыто (родитель монтирует его с key={track._id}),
// поэтому состояние каждый раз начинается с чистого листа
export const TrimModal = ({ track, onClose }: Props) => {
    const { playTrack } = useAudioPlayer()
    const { duration, currentTime } = useAudioInfo()
    const { data: peaks } = useTrackPeaksQuery(track._id)
    const mutation = useTrimTrackMutation()

    const compose = useCompose()
    const [added, setAdded] = useState(false)

    const [range, setRange] = useState<{ start: number; end: number } | null>(() => {
        const t = getTrim()
        return t && t.trackId === track._id ? { start: t.start, end: t.end } : null
    })
    const [titleInput, setTitleInput] = useState<string | null>(null)
    const [previewing, setPreviewing] = useState(false)
    const [saved, setSaved] = useState<TrackInfo | null>(null)
    const [error, setError] = useState<string | null>(null)

    const trackRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<'start' | 'end' | null>(null)
    const keepRef = useRef(false)
    const previewingRef = useRef(false)

    const ready = duration > MIN_LEN
    const start = ready ? clamp(range?.start ?? 0, 0, duration - MIN_LEN) : 0
    const end = ready ? clamp(range?.end ?? duration, start + MIN_LEN, duration) : 0
    const isFull = ready && start <= 0.05 && end >= duration - 0.05

    const moveStart = (v: number) => setRange({ start: clamp(round1(v), 0, end - MIN_LEN), end })
    const moveEnd = (v: number) => setRange({ start, end: clamp(round1(v), start + MIN_LEN, duration) })

    // Esc закрывает, фон не скроллится
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prev
        }
    }, [onClose])

    // Если слушали отрезок «для пробы» и окно закрыли без решения, снимаем обрезку
    useEffect(() => {
        previewingRef.current = previewing
    }, [previewing])

    useEffect(
        () => () => {
            if (previewingRef.current && !keepRef.current) clearTrim()
        },
        []
    )

    // Пока идёт прослушивание, границы обновляются на лету
    useEffect(() => {
        if (previewing && ready) setTrim({ trackId: track._id, start, end })
    }, [previewing, ready, start, end, track._id])

    const playFromStart = () => {
        const audio = getAudio()
        if (!audio) return
        audio.currentTime = start
        void audio.play().catch(() => {})
    }

    const preview = () => {
        if (!ready) return
        setPreviewing(true)
        setTrim({ trackId: track._id, start, end })
        playFromStart()
    }

    const applyOnce = () => {
        if (!ready || isFull) return
        keepRef.current = true
        setTrim({ trackId: track._id, start, end })
        playFromStart()
        onClose()
    }

    const autoTitle = `${track.title} (${fmt(start)}–${fmt(end)})`
    const title = titleInput ?? autoTitle

    const save = () => {
        if (!ready || isFull) return
        setError(null)

        mutation.mutate(
            { trackId: track._id, start, end, title: title.trim() },
            {
                onSuccess: (t) =>
                    setSaved({
                        _id: t._id,
                        title: t.title,
                        artist: t.artist,
                        fileUrl: t.fileUrl,
                        coverUrl: t.coverUrl,
                    }),
                onError: (e) =>
                    setError(
                        isAxiosError(e)
                            ? (e.response?.data?.message ?? 'Не удалось обрезать трек')
                            : 'Не удалось обрезать трек'
                    ),
            }
        )
    }

    const addToCompose = () => {
        if (!ready) return
        const ok = addSegment({
            trackId: track._id,
            title: track.title,
            artist: track.artist,
            coverUrl: track.coverUrl,
            start,
            end,
        })
        if (!ok) return
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1600)
    }

    /* ---------- Перетаскивание границ по волне ---------- */

    const timeAt = (clientX: number) => {
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) return 0
        return clamp((clientX - rect.left) / rect.width, 0, 1) * duration
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!ready) return
        const t = timeAt(e.clientX)
        // Двигаем ту границу, что ближе к месту нажатия
        dragRef.current = Math.abs(t - start) <= Math.abs(t - end) ? 'start' : 'end'
        e.currentTarget.setPointerCapture(e.pointerId)
        if (dragRef.current === 'start') moveStart(t)
        else moveEnd(t)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return
        const t = timeAt(e.clientX)
        if (dragRef.current === 'start') moveStart(t)
        else moveEnd(t)
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = null
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
            /* указатель уже отпущен */
        }
    }

    const bars = peaks && peaks.length > 20 ? peaks : FLAT_BARS
    const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0)
    const busy = mutation.isPending

    return createPortal(
        <div
            className="fixed inset-0 z-[10002] overflow-y-auto overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trim-title"
        >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

            <div
                className="relative flex min-h-full items-center justify-center p-3 sm:p-4"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose()
                }}
            >
                <div className="relative w-full max-w-xl rounded-3xl p-px bg-gradient-to-br from-indigo-500/50 via-white/10 to-fuchsia-500/50 shadow-[0_30px_80px_-10px_rgba(249, 92, 158,0.35)]">
                    <div className="relative rounded-[calc(1.5rem-1px)] bg-zinc-950 p-4 sm:p-6 flex flex-col gap-4 text-zinc-100">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 id="trim-title" className="text-lg sm:text-xl font-bold">Обрезать трек</h2>
                                <p className="text-xs sm:text-sm text-zinc-400 truncate">
                                    {track.title}
                                    {track.artist ? ` · ${track.artist}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Закрыть"
                                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {saved ? (
                            <div className="flex flex-col gap-4 py-2">
                                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-4">
                                    <p className="text-sm font-semibold text-emerald-300">Готово ✓</p>
                                    <p className="text-sm text-zinc-200 mt-1 break-words">«{saved.title}» добавлен в «Мои треки».</p>
                                    <p className="text-xs text-zinc-400 mt-1">BPM и тональность появятся через несколько секунд.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            playTrack(saved, [saved])
                                            onClose()
                                        }}
                                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
                                    >
                                        ▶ Включить
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {!ready && (
                                    <p className="text-sm text-amber-300/90 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2">
                                        Ждём загрузки трека. Если включён мини-плеер, верните его в окно.
                                    </p>
                                )}

                                {/* Волна с двумя границами */}
                                <div
                                    ref={trackRef}
                                    onPointerDown={onPointerDown}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={onPointerUp}
                                    onPointerCancel={onPointerUp}
                                    style={{ touchAction: 'none' }}
                                    className={`relative h-24 select-none rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden ${ready ? 'cursor-ew-resize' : 'opacity-50'}`}
                                >
                                    <div className="absolute inset-0 flex items-center gap-px px-1">
                                        {bars.map((p, i) => {
                                            const center = ((i + 0.5) / bars.length) * duration
                                            const inside = center >= start && center <= end
                                            return (
                                                <span
                                                    key={i}
                                                    className="flex-1 rounded-full"
                                                    style={{
                                                        height: `${Math.max(8, p * 100)}%`,
                                                        background: inside ? 'rgb(255 159 214)' : 'rgba(255,255,255,0.18)',
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>

                                    {ready && (
                                        <>
                                            {/* Позиция воспроизведения */}
                                            <span
                                                className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none"
                                                style={{ left: `${pct(currentTime)}%` }}
                                            />

                                            {/* Границы */}
                                            {([start, end] as const).map((t, i) => (
                                                <span
                                                    key={i}
                                                    className="absolute top-0 bottom-0 w-4 -ml-2 flex items-center justify-center pointer-events-none"
                                                    style={{ left: `${pct(t)}%` }}
                                                >
                                                    <span className="w-1 h-full rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(165,180,252,0.9)]" />
                                                    <span className="absolute w-3.5 h-6 rounded-md bg-indigo-300 border border-indigo-100/60" />
                                                </span>
                                            ))}
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 -mt-2">
                                    <span>0:00</span>
                                    <span className="text-zinc-300">Длина отрезка: {fmtPrecise(Math.max(0, end - start))}</span>
                                    <span>{fmt(duration)}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <HandleCard label="Начало" value={start} now={currentTime} disabled={!ready} onChange={moveStart} />
                                    <HandleCard label="Конец" value={end} now={currentTime} disabled={!ready} onChange={moveEnd} />
                                </div>

                                {/* Вариант 1: на один раз */}
                                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 sm:p-4 flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold">На один раз</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Сыграет только выбранная часть, потом включится следующий трек. Сам трек не изменится.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={preview}
                                            disabled={!ready}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-100 bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            ▶ Прослушать отрезок
                                        </button>
                                        <button
                                            type="button"
                                            onClick={applyOnce}
                                            disabled={!ready || isFull}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Играть только отрезок
                                        </button>
                                    </div>
                                </div>

                                {/* Вариант 2: новый трек */}
                                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 sm:p-4 flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold">Сохранить как новый трек</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Создадим копию с этой частью и добавим в «Мои треки». Оригинал останется как есть.
                                        </p>
                                    </div>

                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitleInput(e.target.value)}
                                        maxLength={120}
                                        disabled={busy}
                                        aria-label="Название нового трека"
                                        className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    />

                                    {error && (
                                        <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-sm text-rose-300">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={save}
                                        disabled={!ready || isFull || busy || !title.trim()}
                                        style={{ backgroundImage: 'linear-gradient(90deg, #f95c9e, #e0407f)' }}
                                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {busy ? (
                                            <span className="inline-flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                Режем и загружаем...
                                            </span>
                                        ) : (
                                            '✂ Создать трек из отрезка'
                                        )}
                                    </button>
                                </div>

                                {/* Вариант 3: добавить в сборку */}
                                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 sm:p-4 flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold">Добавить в сборку</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Склейте несколько отрезков (можно из разных треков) в один новый трек.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={addToCompose}
                                            disabled={!ready || compose.segments.length >= MAX_SEGMENTS}
                                            className="btn-accent"
                                        >
                                            {added ? 'Добавлено ✓' : '＋ Добавить отрезок'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openCompose}
                                            disabled={compose.segments.length === 0}
                                            className="btn-soft"
                                        >
                                            Открыть сборку ({compose.segments.length})
                                        </button>
                                    </div>
                                </div>

                                {isFull && ready && (
                                    <p className="text-xs text-zinc-500 text-center -mt-2">
                                        Выбран весь трек. Сдвиньте границы, чтобы вырезать часть.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}