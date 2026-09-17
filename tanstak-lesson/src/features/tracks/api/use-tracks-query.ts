import { useQuery } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

type Track = {
    _id: string
    title: string
    fileUrl: string
    coverUrl?: string | null
    fileSize: number
}

export const useMyTracksQuery = () => {
    return useQuery({
        queryKey: ['my-tracks'],
        queryFn: async () => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const response = await fetch(`${MY_API_BASE}/api/tracks/my`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!response.ok) throw new Error('Не удалось загрузить треки')
            const data = await response.json()
            return data.tracks as Track[]
        }
    })
}