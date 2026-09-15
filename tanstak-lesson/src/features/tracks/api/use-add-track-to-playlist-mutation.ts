import { useMutation } from '@tanstack/react-query'
import { client } from '../../../shared/api/client.ts'

export const useAddTrackToPlaylistMutation = () => {
    return useMutation({
        mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
            const response = await client.POST('/playlists/{playlistId}/relationships/tracks', {
                params: { path: { playlistId } },
                body: {
                    data: {
                        type: 'playlist-tracks',
                        attributes: { trackId }
                    }
                }
            })

            if (response.error) {
                const apiError = response.error as any
                const message = apiError?.errors?.[0]?.detail || apiError?.title || 'Не удалось привязать трек к плейлисту'
                throw new Error(message)
            }

            return response.data
        }
    })
}