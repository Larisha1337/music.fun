import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useUploadTrackCoverMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ trackId, cover }: { trackId: string; cover: File }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const body = new FormData()
            body.append('cover', cover)

            const response = await fetch(`${MY_API_BASE}/api/tracks/${trackId}/cover`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body
            })

            if (!response.ok) throw new Error('Ошибка загрузки обложки')
            return response.json()
        },
        onSuccess: () => {
            // Инвалидируем оба списка, чтобы обложка обновилась везде
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })
        }
    })
}