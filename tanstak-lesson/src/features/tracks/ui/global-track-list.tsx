import { useCallback, useMemo, useState } from 'react'
import { TrackList, type Track } from './track-list'
import { TrackSearch } from '@/shared/tracks/ui/track-search.tsx'
import { useDebounce } from '@/shared/ui/lib/debounce/useDebounce.ts'
import { toCamelot, camelotSortValue } from '@/shared/ui/lib/music-key.ts'
import { useInfiniteTracksQuery, useTrackFacetsQuery, type TrackSort } from '../api/use-infinite-tracks-query.ts'

const SORT_OPTIONS: { value: TrackSort; label: string }[] = [
    { value: 'new', label: 'Сначала новые' },
    { value: 'bpm-asc', label: 'BPM: по возрастанию' },
    { value: 'bpm-desc', label: 'BPM: по убыванию' },
    { value: 'key', label: 'По тональности' },
]

const selectClass =
    'px-3 py-2 rounded-xl text-sm bg-zinc-950/60 border border-zinc-800 text-zinc-200 outline-none cursor-pointer ' +
    'focus:border-indigo-500/50 transition-colors [&>option]:bg-zinc-900'

export const GlobalTrackList = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortMode, setSortMode] = useState<TrackSort>('new')
    const [keyFilter, setKeyFilter] = useState('')

    const debouncedSearch = useDebounce(searchQuery, 300)
    const q = debouncedSearch.trim()

    const { data, isPending, isPlaceholderData, hasNextPage, isFetchingNextPage, fetchNextPage } =
        useInfiniteTracksQuery({ q, sort: sortMode, key: keyFilter })
    const { data: facets } = useTrackFacetsQuery()

    // Склеиваем страницы. Дубли убираем: пока листаешь, в начало могут добавиться новые треки
    const tracks = useMemo(() => {
        const seen = new Set<string>()
        const list: Track[] = []
        for (const page of data?.pages ?? []) {
            for (const t of page.tracks) {
                if (!seen.has(t._id)) {
                    seen.add(t._id)
                    list.push(t)
                }
            }
        }
        return list
    }, [data])

    const total = data?.pages[0]?.total ?? 0

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const availableKeys = useMemo(
        () => [...(facets?.keys ?? [])].sort((a, b) => camelotSortValue(a) - camelotSortValue(b)),
        [facets]
    )

    const isFiltered = Boolean(q || keyFilter)

    return (
        <div className="w-full flex flex-col gap-3 sm:gap-4">
            <TrackSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Поиск по названию, исполнителю или автору..."
            />

            {facets?.hasAnalysis && (
                <div className="flex flex-wrap items-center gap-2 max-w-4xl mx-auto w-full -mt-1">
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as TrackSort)}
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

                    {isFiltered && !isPending && (
                        <span className="text-xs text-zinc-500 ml-auto">Найдено: {total}</span>
                    )}
                </div>
            )}

            <div className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
                <TrackList
                    tracks={tracks}
                    isLoading={isPending}
                    emptyMessage={isFiltered ? 'Ничего не найдено по вашему запросу' : 'В глобальной ленте пока нет треков'}
                    showAuthor={true}
                    enableActions={false}
                    hasMore={Boolean(hasNextPage)}
                    isFetchingMore={isFetchingNextPage}
                    onLoadMore={loadMore}
                />
            </div>
        </div>
    )
}