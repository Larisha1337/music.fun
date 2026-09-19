import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../../shared/config/local-storage-key.ts'

const API_BASE = 'http://localhost:5000/api'

export const useUploadTrackCoverMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ trackId, cover }: { trackId: string; cover: File }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const body = new FormData()
            body.append('cover', cover)

            const response = await fetch(`${API_BASE}/tracks/${trackId}/cover`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: body
            })

            if (!response.ok) throw new Error('Ошибка загрузки обложки')
            return response.json()
        },
        onSuccess: () => {
            // Обязательно сбрасываем кэш треков
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
        }
    })
}