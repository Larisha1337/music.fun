import { useQuery } from '@tanstack/react-query'
import { type Track } from '@/features/tracks/ui/track-list'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useMyTracksQuery = () => {
    return useQuery({
        queryKey: ['my-tracks'],
        queryFn: async () => {
            const token = localStorage.getItem('token') // или твой способ хранения токена
            const response = await fetch(`${MY_API_BASE}/api/tracks/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Не удалось загрузить мои треки')
            const data = await response.json()
            return data.tracks as Track[]
        }
    })
}