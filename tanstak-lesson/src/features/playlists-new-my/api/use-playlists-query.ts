import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

export interface Playlist {
    _id: string
    name: string
    description?: string
    tracks?: string[]
}

export const useMyPlaylistsQuery = () => {
    const token = localStorage.getItem(localStorageKey.accessToken)

    return useQuery({
        queryKey: ['my-playlists'],
        queryFn: async () => {
            const { data } = await api.get<Playlist[]>('/playlists')
            return data
        },
        enabled: Boolean(token), // Запрос уйдет только при наличии токена
        retry: false,            // Отключаем бесконечный повтор при 401
    })
}

export const useAddTrackToPlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
            const { data } = await api.post(`/playlists/${playlistId}/tracks`, { trackId })
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] })
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        }
    })
}

// 👇 ВОТ ЭТА ЧАСТЬ НОВАЯ, ДЛЯ СОЗДАНИЯ ПЛЕЙЛИСТА
export const useCreatePlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ name, description }: { name: string; description?: string }) => {
            const { data } = await api.post('/playlists', { name, description })
            return data
        },
        onSuccess: () => {
            // Обновляем список плейлистов после успешного создания
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        }
    })
}