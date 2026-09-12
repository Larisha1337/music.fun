import { useQuery } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

export const avatarKeys = {
    avatar: ['my-avatar'] as const
}

export const useAvatarQuery = () => {
    return useQuery({
        queryKey: avatarKeys.avatar,
        queryFn: async () => {
            const token = localStorage.getItem(localStorageKey.accessToken)

            // 1. Если токена нет вообще (пользователь не залогинен),
            // не делаем запрос и сразу возвращаем null
            if (!token) {
                return null
            }

            const response = await fetch('http://localhost:5000/api/user/avatar', {
                headers: { Authorization: `Bearer ${token}` }
            })

            // 2. Если сервер вернул 401 Unauthorized или другую ошибку,
            // возвращаем null, чтобы не было ошибки undefined
            if (!response.ok) {
                return null
            }

            const data = await response.json()

            // 3. Оператор ?? гарантирует, что если avatarUrl нет, вернется null
            return data.avatarUrl ?? null
        }
    })
}