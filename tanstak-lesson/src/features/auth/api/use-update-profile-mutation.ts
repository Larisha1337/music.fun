import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useUpdateProfileMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ name }: { name: string }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)

            const response = await fetch(`${MY_API_BASE}/api/user/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.message ?? 'Ошибка при обновлении имени')
            }

            return response.json()
        },
        onSuccess: () => {
            // Перезапрашиваем данные пользователя ('me'), чтобы отобразить новое имя
            queryClient.invalidateQueries({ queryKey: ['me'] })
            queryClient.invalidateQueries({ queryKey: ['tracks'] })
        }
    })
}