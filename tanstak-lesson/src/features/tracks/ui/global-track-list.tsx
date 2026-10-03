import { useState, useMemo } from 'react'
import { TrackList } from './track-list'
import { useAllTracksQuery } from "@/features/tracks/public/api/use-all-tracks-query.ts"
import { TrackSearch } from "@/shared/tracks/ui/track-search.tsx"
import { useDebounce } from "@/shared/ui/lib/debounce/useDebounce.ts"

export const GlobalTrackList = () => {
    const { data: tracks = [], isLoading } = useAllTracksQuery()
    const [searchQuery, setSearchQuery] = useState('')

    const debouncedSearch = useDebounce(searchQuery, 300)

    const filteredTracks = useMemo(() => {
        if (!debouncedSearch.trim()) return tracks

        const query = debouncedSearch.toLowerCase()
        return tracks.filter((track) => {
            const titleMatch = track.title.toLowerCase().includes(query)
            const emailMatch = track.authorEmail?.toLowerCase().includes(query)
            return titleMatch || emailMatch
        })
    }, [tracks, debouncedSearch])

    return (
        <div className="w-full">
            <TrackSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Поиск по названию или автору загрузки..."
            />

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