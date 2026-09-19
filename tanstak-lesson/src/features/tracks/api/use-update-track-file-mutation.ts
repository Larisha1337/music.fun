import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useUpdateTrackFileMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ trackId, file }: { trackId: string; file: File }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const body = new FormData()
            body.append('file', file)

            const response = await fetch(`${MY_API_BASE}/api/tracks/${trackId}/file`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.message || 'Не удалось обновить аудиофайл')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
        }
    })
}