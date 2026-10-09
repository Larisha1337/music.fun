import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

const coverOf = (url?: string | null) =>
    url ? (url.startsWith('http') ? url : `${MY_API_BASE}${url}`) : null

type RowProps = {
    track: TrackInfo
    isCurrent: boolean
    onPlay: () => void
    onRemove: () => void
}

const QueueRow = ({ track, isCurrent, onPlay, onRemove }: RowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track._id })
    const cover = coverOf(track.coverUrl)

    const style: React.CSSProperties = {
        // Двигаем только по вертикали
        transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
        transition,
        zIndex: isDragging ? 5 : undefined,
        opacity: isDragging ? 0.6 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-current={isCurrent ? 'true' : undefined}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl ${isCurrent ? 'bg-indigo-500/15' : 'hover:bg-white/5'}`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Перетащить трек"
                title="Перетащить"
                style={{ touchAction: 'none' }}
                className="w-6 h-9 shrink-0 text-zinc-500 hover:text-zinc-200 cursor-grab active:cursor-grabbing"
            >
                ⠿
            </button>

            <button type="button" onClick={onPlay} className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer">
                <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                    {cover ? (
                        <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm">🎵</span>
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold truncate ${isCurrent ? 'text-indigo-300' : 'text-white'}`}>
                        {track.title}
                    </span>
                    <span className="block text-xs text-zinc-400 truncate">{track.artist || 'Неизвестный исполнитель'}</span>
                </span>
            </button>

            {isCurrent ? (
                <span className="px-1.5 text-[10px] font-semibold text-indigo-300 shrink-0">Играет</span>
            ) : (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label="Убрать из очереди"
                    title="Убрать из очереди"
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                    ✕
                </button>
            )}
        </div>
    )
}

type Props = {
    open: boolean
    onClose: () => void
}

export const QueuePanel = ({ open, onClose }: Props) => {
    const { playlist, currentTrack, playTrack, moveInQueue, removeFromQueue } = useAudioPlayer()
    const panelRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        if (!open) return

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Element | null
            if (!target || panelRef.current?.contains(target)) return
            if (target.closest('[data-queue-toggle]')) return // кнопка сама переключает панель
            onClose()
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open, onClose])

    // При открытии прокручиваем список к играющему треку
    useEffect(() => {
        if (!open) return
        const list = listRef.current
        const row = list?.querySelector<HTMLElement>('[data-current="true"]')
        if (list && row) {
            list.scrollTop = Math.max(0, row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2)
        }
    }, [open])

    if (!open) return null

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (over && active.id !== over.id) moveInQueue(String(active.id), String(over.id))
    }

    const currentIndex = currentTrack ? playlist.findIndex((t) => t._id === currentTrack._id) : -1
    const upcoming = currentIndex >= 0 ? playlist.length - currentIndex - 1 : playlist.length

    return createPortal(
        <div
            ref={panelRef}
            role="dialog"
            aria-label="Очередь воспроизведения"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}
            className="fixed right-3 sm:right-4 z-[10001] w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(60vh,28rem)] flex flex-col rounded-2xl bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl text-zinc-100"
        >
            <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 shrink-0">
                <div>
                    <h3 className="text-sm font-bold">Очередь</h3>
                    <p className="text-[11px] text-zinc-500">
                        {playlist.length === 0 ? 'Пока пусто' : `Далее: ${upcoming} · перетаскивайте за ⠿`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть очередь"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    ✕
                </button>
            </div>

            <div ref={listRef} className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 pb-2">
                {playlist.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500 py-8 px-4">
                        Включите трек из списка или плейлиста, и очередь появится здесь
                    </p>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={playlist.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-0.5">
                                {playlist.map((track) => (
                                    <QueueRow
                                        key={track._id}
                                        track={track}
                                        isCurrent={currentTrack?._id === track._id}
                                        onPlay={() => playTrack(track)}
                                        onRemove={() => removeFromQueue(track._id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>,
        document.body
    )
}