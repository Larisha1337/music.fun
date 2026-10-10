import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { isAxiosError } from 'axios'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAudioPlayer, type TrackInfo } from '@/shared/ui/lib/audio-player-context'
import {
    clearCompose,
    closeCompose,
    composeDuration,
    CROSSFADES,
    effectiveFade,
    MAX_SEGMENTS,
    MAX_TOTAL,
    moveSegment,
    openCompose,
    removeSegment,
    setCrossfade,
    useCompose,
    type ComposeSegment,
} from '@/shared/ui/lib/compose-store.ts'
import { useComposeTrackMutation } from '@/shared/tracks/api/compose.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

const coverOf = (url?: string | null) =>
    url ? (url.startsWith('http') ? url : `${MY_API_BASE}${url}`) : null

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

// Один и тот же исходный трек всегда получает один и тот же цвет
const hueOf = (id: string) => {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
    return h
}

const SegmentRow = ({ seg, index }: { seg: ComposeSegment; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: seg.id })
    const cover = coverOf(seg.coverUrl)

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
                transition,
                opacity: isDragging ? 0.6 : 1,
                zIndex: isDragging ? 5 : undefined,
            }}
            className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/10"
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Перетащить отрезок"
                style={{ touchAction: 'none' }}
                className="w-6 h-9 shrink-0 text-zinc-500 hover:text-zinc-200 cursor-grab active:cursor-grabbing"
            >
                ⠿
            </button>

            <span className="w-5 text-center text-[11px] font-mono text-zinc-500 shrink-0">{index + 1}</span>

            <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                {cover ? <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" /> : <span>🎵</span>}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white truncate">{seg.title}</span>
                <span className="block text-xs text-zinc-400 truncate">
                    {seg.artist ? `${seg.artist} · ` : ''}
                    {fmt(seg.start)}–{fmt(seg.end)} · {fmt(seg.end - seg.start)}
                </span>
            </span>

            <span
                aria-hidden="true"
                className="w-2 h-8 rounded-full shrink-0"
                style={{ background: `hsl(${hueOf(seg.trackId)} 80% 70%)` }}
            />

            <button
                type="button"
                onClick={() => removeSegment(seg.id)}
                aria-label="Убрать отрезок"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
                ✕
            </button>
        </div>
    )
}

const ComposeModal = () => {
    const { segments, crossfade } = useCompose()
    const { playTrack } = useAudioPlayer()
    const mutation = useComposeTrackMutation()

    const [titleInput, setTitleInput] = useState('')
    const [saved, setSaved] = useState<TrackInfo | null>(null)
    const [error, setError] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeCompose()
        }
        window.addEventListener('keydown', onKeyDown)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prev
        }
    }, [])

    const total = composeDuration(segments, crossfade)
    const fade = effectiveFade(segments, crossfade)
    const tooLong = total > MAX_TOTAL
    const busy = mutation.isPending
    const canCreate = segments.length >= 2 && !tooLong && !busy

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (over && active.id !== over.id) moveSegment(String(active.id), String(over.id))
    }

    const create = () => {
        setError(null)

        mutation.mutate(
            {
                title: titleInput.trim(),
                crossfade,
                segments: segments.map(({ trackId, start, end }) => ({ trackId, start, end })),
            },
            {
                onSuccess: (t) => {
                    setSaved({ _id: t._id, title: t.title, artist: t.artist, fileUrl: t.fileUrl, coverUrl: t.coverUrl })
                    clearCompose() // черновик использован
                },
                onError: (e) =>
                    setError(
                        isAxiosError(e)
                            ? (e.response?.data?.message ?? 'Не удалось собрать трек')
                            : 'Не удалось собрать трек'
                    ),
            }
        )
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[10003] overflow-y-auto overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-title"
        >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

            <div
                className="relative flex min-h-full items-center justify-center p-3 sm:p-4"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeCompose()
                }}
            >
                <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-4 sm:p-6 flex flex-col gap-4 text-zinc-100 shadow-[0_30px_80px_-10px_rgba(249,92,158,0.25)]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 id="compose-title" className="font-display text-base sm:text-lg font-extrabold uppercase tracking-wide">
                                Сборка из отрезков
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Склейте несколько отрезков в один новый трек
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeCompose}
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
                                        closeCompose()
                                    }}
                                    className="btn-accent"
                                >
                                    ▶ Включить
                                </button>
                                <button type="button" onClick={closeCompose} className="btn-soft">Закрыть</button>
                            </div>
                        </div>
                    ) : segments.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-8 px-4">
                            Сборка пуста. Включите трек, нажмите ✂ в плеере, выберите часть и нажмите «Добавить в сборку».
                            Так можно набрать отрезки из разных треков.
                        </p>
                    ) : (
                        <>
                            {/* Схема сборки: длина блока = длина отрезка, цвет = исходный трек */}
                            <div className="flex h-2.5 gap-0.5 rounded-full overflow-hidden" aria-hidden="true">
                                {segments.map((s) => (
                                    <span
                                        key={s.id}
                                        className="min-w-[3px]"
                                        style={{ flex: s.end - s.start, background: `hsl(${hueOf(s.trackId)} 80% 70%)` }}
                                    />
                                ))}
                            </div>

                            <div className="max-h-[38vh] overflow-y-auto custom-scrollbar pr-1">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-1.5">
                                            {segments.map((seg, i) => (
                                                <SegmentRow key={seg.id} seg={seg} index={i} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Переход между отрезками</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {CROSSFADES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            aria-pressed={crossfade === c}
                                            onClick={() => setCrossfade(c)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                                                crossfade === c
                                                    ? 'bg-pink-300 text-zinc-950 border-pink-300'
                                                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {c === 0 ? 'Без перехода' : `${String(c).replace('.', ',')} с`}
                                        </button>
                                    ))}
                                </div>
                                {crossfade > 0 && fade < crossfade && (
                                    <p className="text-[11px] text-zinc-500">Переход сокращён до {fade.toFixed(1).replace('.', ',')} с: отрезки слишком короткие</p>
                                )}
                            </div>

                            <input
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                maxLength={120}
                                disabled={busy}
                                placeholder={`Сборка из ${segments.length} отрезков`}
                                aria-label="Название нового трека"
                                className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-300 disabled:opacity-60"
                            />

                            {tooLong && (
                                <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-sm text-amber-200">
                                    Сборка длиннее {MAX_TOTAL / 60} минут. Уберите часть отрезков.
                                </div>
                            )}
                            {segments.length < 2 && (
                                <p className="text-xs text-zinc-500 -mt-1">Нужно минимум 2 отрезка</p>
                            )}
                            {error && (
                                <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-sm text-rose-300">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <div className="text-xs text-zinc-400">
                                    <span className="font-mono text-zinc-200">{fmt(total)}</span> · {segments.length} из {MAX_SEGMENTS} отрезков
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={clearCompose} disabled={busy} className="btn-soft">
                                        Очистить
                                    </button>
                                    <button type="button" onClick={create} disabled={!canCreate} className="btn-accent">
                                        {busy ? (
                                            <>
                                                <span className="w-4 h-4 rounded-full border-2 border-zinc-900/30 border-t-zinc-900 animate-spin" />
                                                Собираем...
                                            </>
                                        ) : (
                                            '✂ Создать трек'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

/** Кнопка для шапки: видна, пока в сборке есть отрезки. Окно открывается из шапки или из окна обрезки */
export const ComposeEntry = () => {
    const { segments, open } = useCompose()

    return (
        <>
            {segments.length > 0 && (
                <button
                    type="button"
                    onClick={openCompose}
                    title="Сборка из отрезков"
                    className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white cursor-pointer transition-colors"
                >
                    <span aria-hidden="true">✂</span>
                    <span className="hidden sm:inline">Сборка</span>
                    <span className="min-w-5 h-5 px-1 grid place-items-center rounded-full bg-pink-300 text-zinc-950 text-[11px] font-extrabold">
                        {segments.length}
                    </span>
                </button>
            )}
            {open && <ComposeModal />}
        </>
    )
}