import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'
import type { Track } from '@/features/tracks/ui/track-list.tsx'

type ComposePayload = {
    title: string
    crossfade: number
    segments: { trackId: string; start: number; end: number }[]
}

export const useComposeTrackMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: ComposePayload) => {
            // скачивание, склейка и загрузка занимают от нескольких секунд до минуты
            const { data } = await api.post('/tracks/compose', payload, { timeout: 300_000 })
            return data.track as Track
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })
        },
    })
}