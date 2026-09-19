import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../../shared/config/local-storage-key.ts'

const MY_API_BASE = 'http://localhost:5000'

export const useUpdateTrackMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ trackId, title }: { trackId: string; title: string }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const response = await fetch(`${MY_API_BASE}/api/tracks/${trackId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось обновить трек')
            }
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            onSuccessCallback?.()
        }
    })
}