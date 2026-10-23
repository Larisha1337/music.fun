import { useQuery } from '@tanstack/react-query'
import type { Track } from '@/features/tracks/ui/track-list'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useAllTracksQuery = (enabled = true) => {
    return useQuery({
        queryKey: ['all-tracks'],
        enabled,
        staleTime: 60_000,
        queryFn: async () => {
            const response = await fetch(`${MY_API_BASE}/api/tracks`)
            if (!response.ok) throw new Error('Не удалось загрузить треки')
            const data = await response.json()
            return data.tracks as Track[]
        }
    })
}