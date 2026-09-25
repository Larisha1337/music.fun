import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playlistApi, type Playlist } from '@/shared/api/playlist'

export const PLAYLIST_KEYS = {
    all: ['playlis'] as const,
    detail: (id: string) => ['playlis', id] as const,
}

// 1. Получить список всех плейлистов (для Сайбара)
export const usePlaylists = () => {
    return useQuery({
        queryKey: PLAYLIST_KEYS.all,
        queryFn: playlistApi.getMyPlaylists,
    })
}

// 2. Получить конкретный плейлист с треками (для страницы плейлиста)
export const usePlaylist = (id: string) => {
    return useQuery({
        queryKey: PLAYLIST_KEYS.detail(id),
        queryFn: () => playlistApi.getPlaylistById(id),
        enabled: !!id,
    })
}

// 3. Создать новый плейлист
export const useCreatePlaylist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: playlistApi.createPlaylist,
        onSuccess: () => {
            // Перезапрашиваем список в сайдбаре
            queryClient.invalidateQueries({ queryKey: PLAYLIST_KEYS.all })
        }
    })
}

// 4. Обновить плейлист (имя/обложка)
export const useUpdatePlaylist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: playlistApi.updatePlaylist,
        onSuccess: (updatedPlaylist: Playlist) => {
            queryClient.invalidateQueries({ queryKey: PLAYLIST_KEYS.all })
            queryClient.invalidateQueries({ queryKey: PLAYLIST_KEYS.detail(updatedPlaylist._id) })
        }
    })
}

// 5. Удалить плейлист
export const useDeletePlaylist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: playlistApi.deletePlaylist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLAYLIST_KEYS.all })
        }
    })
}

// 6. Добавить трек в плейлист
export const useAddTrackToPlaylist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: playlistApi.addTrack,
        onSuccess: (_, variables) => {
            // Обновляем данные конкретного плейлиста, куда добавили трек
            queryClient.invalidateQueries({ queryKey: PLAYLIST_KEYS.detail(variables.playlistId) })
        }
    })
}

// 7. Удалить трек из плейлиста
export const useRemoveTrackFromPlaylist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: playlistApi.removeTrack,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PLAYLIST_KEYS.detail(variables.playlistId) })
        }
    })
}