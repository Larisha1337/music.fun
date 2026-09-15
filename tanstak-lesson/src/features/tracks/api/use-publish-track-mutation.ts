import { useMutation } from '@tanstack/react-query'
import { client } from '../../../shared/api/client.ts'

export const usePublishTrackMutation = () => {
    return useMutation({
        mutationFn: async (trackId: string) => {
            const response = await client.POST('/playlists/tracks/{trackId}/actions/publish', {
                params: { path: { trackId } }
            })

            if (response.error) {
                const apiError = response.error as any
                const message = apiError?.errors?.[0]?.detail || apiError?.title || 'Не удалось опубликовать трек'
                throw new Error(message)
            }

            return response.data
        }
    })
}