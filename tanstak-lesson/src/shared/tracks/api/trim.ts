import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'
import type { Track } from '@/features/tracks/ui/track-list'

export const useTrimTrackMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (p: { trackId: string; start: number; end: number; title: string }) => {
            const { data } = await api.post(
                `/tracks/${p.trackId}/trim`,
                { start: p.start, end: p.end, title: p.title },
                { timeout: 180_000 } // скачивание, нарезка и загрузка занимают несколько секунд
            )
            return data.track as Track
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })
        },
    })
}