import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'

/** Волна трека. null, если анализа ещё нет (тогда плеер показывает обычную полоску) */
export const useTrackPeaksQuery = (trackId?: string) =>
    useQuery({
        queryKey: ['track-peaks', trackId],
        enabled: Boolean(trackId),
        staleTime: 5 * 60_000,
        retry: false,
        queryFn: async () => {
            const res = await api.get(`/tracks/${trackId}/peaks`, {
                validateStatus: (s) => s === 200 || s === 204,
            })
            return res.status === 200 ? (res.data.peaks as number[]) : null
        },
    })