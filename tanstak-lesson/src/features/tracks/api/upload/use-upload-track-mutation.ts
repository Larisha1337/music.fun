import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export type UploadTrackFormValues = {
    title: string;
    artist?: string;
    // file больше не нужен, так как трек ищется через Deezer и стримится с YouTube!
}

export const useUploadTrackMutation = (onSuccess?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: UploadTrackFormValues) => {
            const token = localStorage.getItem(localStorageKey.accessToken)

            if (!formData.title?.trim()) {
                throw new Error('Название трека обязательно')
            }

            // Отправляем обычный JSON вместо FormData
            const response = await fetch(`${MY_API_BASE}/api/tracks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    artist: formData.artist?.trim() || ''
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось найти или создать трек')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })

            onSuccess?.()
        }
    })
}