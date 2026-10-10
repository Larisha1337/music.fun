import { useEffect, useState, type CSSProperties } from 'react'
import { isAxiosError } from 'axios'
import { Modal } from '@/shared/ui/modal/remove-modal.tsx'
import { useDebounce } from '@/shared/ui/lib/debounce/useDebounce.ts'
import { useDeezerSearchQuery, useAddFromDeezerMutation, type DeezerResult } from '../../api/deezer.ts'

const inputStyle: CSSProperties = { paddingLeft: 40, paddingRight: 16 }

const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
}

const errorMessage = (e: unknown) =>
    isAxiosError(e) ? e.response?.data?.message ?? 'Не удалось добавить трек' : 'Не удалось добавить трек'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
}

const AddFromDeezerModal = ({ isOpen, onClose }: ModalProps) => {
    const [query, setQuery] = useState('')
    const [added, setAdded] = useState<Set<string>>(new Set())
    const [error, setError] = useState<string | null>(null)

    const debounced = useDebounce(query, 400)
    const q = debounced.trim()

    const { data: results = [], isFetching, isError } = useDeezerSearchQuery(q)
    const add = useAddFromDeezerMutation()

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setAdded(new Set())
            setError(null)
        }
    }, [isOpen])

    const handleAdd = (item: DeezerResult) => {
        setError(null)
        add.mutate(item.deezerId, {
            onSuccess: () => setAdded((prev) => new Set(prev).add(item.deezerId)),
            onError: (e) => setError(errorMessage(e)),
        })
    }

    const isTyping = query.trim() !== q
    const showHint = query.trim().length < 2

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Добавить из Deezer" maxWidth="max-w-xl">
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">🔍</span>
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Название трека или исполнитель"
                        style={inputStyle}
                        className="w-full py-2.5 text-base sm:text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>

                {error && (
                    <div role="alert" className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
                    {showHint ? (
                        <p className="text-center text-sm text-zinc-500 py-8">
                            Введите название, и мы найдём трек. Звук подготовится в фоне, первое включение может занять несколько секунд
                        </p>
                    ) : isTyping || isFetching ? (
                        <p className="text-center text-sm text-zinc-400 py-8 animate-pulse">Ищем...</p>
                    ) : isError ? (
                        <p className="text-center text-sm text-rose-300 py-8">Не удалось выполнить поиск. Попробуйте позже</p>
                    ) : results.length === 0 ? (
                        <p className="text-center text-sm text-zinc-500 py-8">Ничего не найдено</p>
                    ) : (
                        results.map((item) => {
                            const isAdded = added.has(item.deezerId)
                            const isBusy = add.isPending && add.variables === item.deezerId
                            const inLibrary = item.exists || isAdded

                            return (
                                <div
                                    key={item.deezerId}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#27272a]/50 border border-[#3f3f46]/40 hover:bg-[#27272a] transition-colors"
                                >
                                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                                        {item.cover ? (
                                            <img src={item.cover} alt="" loading="lazy" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm">🎵</span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                                        <div className="text-xs text-zinc-400 truncate">
                                            {item.artist}
                                            {item.album ? ` · ${item.album}` : ''}
                                            {item.duration ? ` · ${formatDuration(item.duration)}` : ''}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={inLibrary || isBusy}
                                        onClick={() => handleAdd(item)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                                            inLibrary
                                                ? 'bg-zinc-800 text-zinc-500 cursor-default'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer disabled:opacity-60'
                                        }`}
                                    >
                                        {isBusy ? '...' : isAdded ? 'Добавлено ✓' : item.exists ? 'Уже есть' : '➕ Добавить'}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </Modal>
    )
}

export const AddFromDeezerButton = () => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="btn-accent">
                <span className="text-base leading-none">＋</span>
                Из Deezer
            </button>

            <AddFromDeezerModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    )
}