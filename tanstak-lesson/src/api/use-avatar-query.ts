import { useQuery } from '@tanstack/react-query'
import { localStorageKey } from '../shared/config/local-storage-key.ts'

export const avatarKeys = {
    avatar: ['my-avatar'] as const
}

export const useAvatarQuery = () => {
    return useQuery({
        queryKey: avatarKeys.avatar,
        queryFn: async () => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const response = await fetch('http://localhost:5000/api/user/avatar', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await response.json()
            return data.avatarUrl as string | null
        }
    })
}