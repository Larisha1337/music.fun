import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'
import type { Track } from '@/features/tracks/ui/track-list'

export type TrackSort = 'new' | 'bpm-asc' | 'bpm-desc' | 'key'

export type TracksPage = {
    tracks: Track[]
    page: number
    limit: number
    total: number
    hasMore: boolean
}

type Params = { q: string; sort: TrackSort; key: string }

const PAGE_SIZE = 30

export const useInfiniteTracksQuery = (params: Params) =>
    useInfiniteQuery({
        queryKey: ['all-tracks', 'infinite', params],
        initialPageParam: 1,
        placeholderData: keepPreviousData,
        queryFn: async ({ pageParam }) => {
            const { data } = await api.get<TracksPage>('/tracks', {
                params: {
                    page: pageParam,
                    limit: PAGE_SIZE,
                    q: params.q || undefined,
                    sort: params.sort,
                    key: params.key || undefined,
                },
            })
            return data
        },
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    })

export const useTrackFacetsQuery = () =>
    useQuery({
        queryKey: ['all-tracks', 'facets'],
        staleTime: 30_000,
        queryFn: async () => {
            const { data } = await api.get<{ keys: string[]; hasAnalysis: boolean }>('/tracks/facets')
            return data
        },
    })