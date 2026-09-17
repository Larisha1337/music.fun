import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'
import { avatarKeys } from './use-avatar-query.ts'

const API_BASE = 'http://localhost:5000/api'

export const useUploadAvatarMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (file: File) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const formData = new FormData()

            formData.append('avatar', file)

            const response = await fetch(`${API_BASE}/user/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось загрузить аватарку')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: avatarKeys.avatar })
        }
    })
}