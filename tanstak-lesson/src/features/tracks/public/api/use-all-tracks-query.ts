import { useQuery } from '@tanstack/react-query'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

type Track = {
    _id: string
    title: string
    fileUrl: string
    coverUrl?: string | null
    authorEmail?: string
}

export const useAllTracksQuery = () => {
    return useQuery({
        queryKey: ['all-tracks'],
        queryFn: async () => {
            const response = await fetch(`${MY_API_BASE}/api/tracks`)
            if (!response.ok) throw new Error('Не удалось загрузить треки')
            const data = await response.json()
            return data.tracks as Track[]
        }
    })
}