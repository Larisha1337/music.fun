import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'

export type DeezerResult = {
    deezerId: string
    title: string
    artist: string
    album?: string
    cover?: string | null
    duration?: number
    exists: boolean
}

export const useDeezerSearchQuery = (q: string) =>
    useQuery({
        queryKey: ['deezer-search', q],
        enabled: q.length >= 2,
        staleTime: 60_000,
        retry: false,
        queryFn: async () => {
            const { data } = await api.get('/tracks/deezer/search', { params: { q } })
            return data.results as DeezerResult[]
        },
    })

export const useAddFromDeezerMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (deezerId: string) => {
            const { data } = await api.post('/tracks/deezer', { deezerId })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['deezer-search'] })
        },
    })
}