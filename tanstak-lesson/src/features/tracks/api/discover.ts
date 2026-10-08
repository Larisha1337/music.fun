import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'
import type { Track } from '@/features/tracks/ui/track-list'

export type DiscoverTrack = Track & { reason?: string }

export type SimilarTrack = Track & {
    bpmDiff: number | null
    keyMatch: 'same' | 'compatible' | null
}

export type SimilarResponse = {
    analyzed: boolean
    tracks: SimilarTrack[]
}

export const useRecentTracksQuery = (enabled: boolean) =>
    useQuery({
        queryKey: ['recent-tracks'],
        enabled,
        staleTime: 30_000,
        retry: false,
        queryFn: async () => {
            const { data } = await api.get('/history/recent', { params: { limit: 20 } })
            return data.tracks as DiscoverTrack[]
        },
    })

export const useRecommendedTracksQuery = (enabled: boolean) =>
    useQuery({
        queryKey: ['recommended-tracks'],
        enabled,
        staleTime: 5 * 60_000,
        retry: false,
        queryFn: async () => {
            const { data } = await api.get('/tracks/recommended', { params: { limit: 12 } })
            return data.tracks as DiscoverTrack[]
        },
    })

export const useSimilarTracksQuery = (trackId?: string) =>
    useQuery({
        queryKey: ['similar-tracks', trackId],
        enabled: Boolean(trackId),
        staleTime: 5 * 60_000,
        retry: false,
        queryFn: async () => {
            const { data } = await api.get<SimilarResponse>(`/tracks/${trackId}/similar`)
            return data
        },
    })