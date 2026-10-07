import { useState, useMemo } from 'react'
import { TrackList } from './track-list'
import { useAllTracksQuery } from "@/features/tracks/public/api/use-all-tracks-query.ts"
import { TrackSearch } from "@/shared/tracks/ui/track-search.tsx"
import { useDebounce } from "@/shared/ui/lib/debounce/useDebounce.ts"

export const GlobalTrackList = () => {
    const { data: tracks = [], isLoading } = useAllTracksQuery()
    const [searchQuery, setSearchQuery] = useState('')

    const debouncedSearch = useDebounce(searchQuery, 300)
    const normalizedQuery = debouncedSearch.trim().toLowerCase()

    const filteredTracks = useMemo(() => {
        if (!normalizedQuery) return tracks

        return tracks.filter((track) =>
            track.title.toLowerCase().includes(normalizedQuery) ||
            track.artist?.toLowerCase().includes(normalizedQuery) ||
            track.authorEmail?.toLowerCase().includes(normalizedQuery)
        )
    }, [tracks, normalizedQuery])

    return (
        <div className="w-full flex flex-col gap-3 sm:gap-4">
            <TrackSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Поиск по названию, исполнителю или автору..."
            />

            {normalizedQuery && !isLoading && (
                <p className="text-xs text-zinc-500 px-1">
                    Найдено: {filteredTracks.length}
                </p>
            )}

            <TrackList
                tracks={filteredTracks}
                isLoading={isLoading}
                emptyMessage={searchQuery ? 'Ничего не найдено по вашему запросу' : 'В глобальной ленте пока нет треков'}
                showAuthor={true}
                enableActions={false}
            />
        </div>
    )
}