import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const MY_API_BASE='http://localhost:5000'

export const useDeleteTrackCoverMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (trackId: string) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const response = await fetch(`${MY_API_BASE}/api/tracks/${trackId}/cover`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось удалить обложку')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            onSuccessCallback?.()
        }
    })
}