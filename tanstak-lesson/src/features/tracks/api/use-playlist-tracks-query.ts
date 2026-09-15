import { useQuery } from '@tanstack/react-query'
import { client } from '../../../shared/api/client.ts'

export const usePlaylistTracksQuery = (playlistId: string) => {
    return useQuery({
        queryKey: ['tracks', 'playlist', playlistId],
        queryFn: async () => {
            const response = await client.GET('/playlists/{playlistId}/tracks', {
                params: { path: { playlistId } }
            })
            if (response.error) throw new Error('Не удалось загрузить треки')
            return response.data?.data ?? []
        },
        enabled: !!playlistId
    })
}