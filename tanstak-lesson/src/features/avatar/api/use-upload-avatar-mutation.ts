import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'
import { avatarKeys } from './use-avatar-query.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useUploadAvatarMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (file: File) => {
            const token = localStorage.getItem(localStorageKey.accessToken)

            // Формируем FormData для отправки бинарного файла
            const formData = new FormData()
            formData.append('avatar', file) // 'avatar' — название поля, которое ожидает ваш бэкенд

            const response = await fetch(`${MY_API_BASE}/api/user/avatar`, {
                method: 'POST', // или 'PATCH' в зависимости от вашего API
                headers: {
                    Authorization: `Bearer ${token}`
                    // Важно: 'Content-Type' указывать НЕ нужно,
                    // браузер сам подставит multipart/form-data с нужным boundary
                },
                body: formData
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.message ?? 'Ошибка загрузки аватарки')
            }

            return response.json()
        },
        onSuccess: () => {
            // Инвалидируем кэш аватарки, чтобы UI сразу обновился
            queryClient.invalidateQueries({ queryKey: avatarKeys.avatar })
        }
    })
}