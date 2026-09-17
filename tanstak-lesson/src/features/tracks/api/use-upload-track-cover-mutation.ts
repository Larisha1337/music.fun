import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const API_BASE = 'https://musicfun.it-incubator.app/api/1.0'

export const useUploadTrackCoverMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ trackId, cover }: { trackId: string; cover: File }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const body = new FormData()
            body.append('cover', cover)

            const response = await fetch(`${API_BASE}/api/tracks/${trackId}/cover`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось загрузить обложку')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            onSuccessCallback?.()
        }
    })
}