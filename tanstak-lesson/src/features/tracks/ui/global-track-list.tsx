import { useState, useMemo } from 'react'
import { TrackList } from './track-list'
import { useAllTracksQuery } from "@/features/tracks/public/api/use-all-tracks-query.ts"
import { TrackSearch } from "@/shared/tracks/ui/track-search.tsx"
import { useDebounce } from "@/shared/ui/lib/debounce/useDebounce.ts"
import { toCamelot, camelotSortValue } from '@/shared/ui/lib/music-key.ts'

type SortMode = 'new' | 'bpm-asc' | 'bpm-desc' | 'key'

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'new', label: 'Сначала новые' },
    { value: 'bpm-asc', label: 'BPM: по возрастанию' },
    { value: 'bpm-desc', label: 'BPM: по убыванию' },
    { value: 'key', label: 'По тональности' },
]

const selectClass =
    'px-3 py-2 rounded-xl text-sm bg-zinc-950/60 border border-zinc-800 text-zinc-200 outline-none cursor-pointer ' +
    'focus:border-indigo-500/50 transition-colors [&>option]:bg-zinc-900'

export const GlobalTrackList = () => {
    const { data: tracks = [], isLoading } = useAllTracksQuery()
    const [searchQuery, setSearchQuery] = useState('')
    const [sortMode, setSortMode] = useState<SortMode>('new')
    const [keyFilter, setKeyFilter] = useState('')

    const debouncedSearch = useDebounce(searchQuery, 300)
    const normalizedQuery = debouncedSearch.trim().toLowerCase()

    const hasAnalysis = useMemo(() => tracks.some((t) => t.bpm), [tracks])

    const availableKeys = useMemo(() => {
        const keys = new Set<string>()
        for (const t of tracks) if (t.musicalKey) keys.add(t.musicalKey)
        return [...keys].sort((a, b) => camelotSortValue(a) - camelotSortValue(b))
    }, [tracks])

    const visibleTracks = useMemo(() => {
        let list = tracks

        if (normalizedQuery) {
            list = list.filter((track) =>
                track.title.toLowerCase().includes(normalizedQuery) ||
                track.artist?.toLowerCase().includes(normalizedQuery) ||
                track.authorEmail?.toLowerCase().includes(normalizedQuery)
            )
        }

        if (keyFilter) list = list.filter((t) => t.musicalKey === keyFilter)

        if (sortMode === 'new') return list

        // Треки без анализа всегда в конце списка
        const sorted = [...list]
        if (sortMode === 'bpm-asc' || sortMode === 'bpm-desc') {
            const dir = sortMode === 'bpm-asc' ? 1 : -1
            sorted.sort((a, b) => {
                if (!a.bpm && !b.bpm) return 0
                if (!a.bpm) return 1
                if (!b.bpm) return -1
                return (a.bpm - b.bpm) * dir
            })
        } else {
            sorted.sort((a, b) => camelotSortValue(a.musicalKey) - camelotSortValue(b.musicalKey))
        }
        return sorted
    }, [tracks, normalizedQuery, keyFilter, sortMode])

    const isFiltered = Boolean(normalizedQuery || keyFilter)

    return (
        <div className="w-full flex flex-col gap-3 sm:gap-4">
            <TrackSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Поиск по названию, исполнителю или автору..."
            />

            {hasAnalysis && (
                <div className="flex flex-wrap items-center gap-2 max-w-4xl mx-auto w-full -mt-1">
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        aria-label="Сортировка"
                        className={selectClass}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    <select
                        value={keyFilter}
                        onChange={(e) => setKeyFilter(e.target.value)}
                        aria-label="Фильтр по тональности"
                        className={selectClass}
                    >
                        <option value="">Любая тональность</option>
                        {availableKeys.map((k) => (
                            <option key={k} value={k}>{k} ({toCamelot(k) ?? '?'})</option>
                        ))}
                    </select>

                    {isFiltered && !isLoading && (
                        <span className="text-xs text-zinc-500 ml-auto">Найдено: {visibleTracks.length}</span>
                    )}
                </div>
            )}

            <TrackList
                tracks={visibleTracks}
                isLoading={isLoading}
                emptyMessage={isFiltered ? 'Ничего не найдено по вашему запросу' : 'В глобальной ленте пока нет треков'}
                showAuthor={true}
                enableActions={false}
            />
        </div>
    )
}