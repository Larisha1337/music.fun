import { useQuery } from '@tanstack/react-query'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useMeQuery = () => {
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            if (!token) return null

            const response = await fetch(`${MY_API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                localStorage.removeItem(localStorageKey.accessToken)
                return null
            }

            const data = await response.json()
            return data.user
        }
    })
}