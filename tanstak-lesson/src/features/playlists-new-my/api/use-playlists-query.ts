import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'
import type { Track } from '@/features/tracks/ui/track-list.tsx'
import { api } from '@/shared/api/axiosInstance.ts'
import { toast } from '@/shared/ui/toast.tsx'
import { apiError } from '@/shared/ui/lib/api-error.ts'

export interface Playlist {
    _id: string
    name: string
    description?: string
    coverUrl?: string | null
    isSystem?: boolean
    createdAt?: string
    updatedAt?: string
    previewCovers?: string[]
    tracks?: Track[]
}

/** Элемент списка плейлистов: треки приходят только id-шниками */
export interface PlaylistSummary extends Omit<Playlist, 'tracks'> {
    tracks?: string[]
}

const LIKED_NAME = 'Мне нравится'

export const isLikedPlaylist = (p: { isSystem?: boolean; name: string }) =>
    Boolean(p.isSystem) || p.name === LIKED_NAME

const hasToken = () => Boolean(localStorage.getItem(localStorageKey.accessToken))

/* ---------- Запросы ---------- */

export const useMyPlaylistsQuery = () =>
    useQuery({
        queryKey: ['my-playlists'],
        queryFn: async () => {
            const { data } = await api.get<PlaylistSummary[]>('/playlists')
            return data
        },
        enabled: hasToken(),
        retry: false,
        staleTime: 30_000,
    })

export const playlistQueryOptions = (playlistId: string) =>
    queryOptions({
        queryKey: ['playlist', playlistId],
        queryFn: async () => {
            const { data } = await api.get<Playlist>(`/playlists/${playlistId}`)
            return data
        },
        staleTime: 20_000,
    })

export const usePlaylistQuery = (playlistId: string) =>
    useQuery({
        ...playlistQueryOptions(playlistId),
        enabled: hasToken() && Boolean(playlistId),
    })

/* ---------- Мутации ---------- */

export const useCreatePlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: FormData | { name: string; description?: string }) => {
            const { data } = await api.post<Playlist>('/playlists', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        },
    })
}

export const useAddTrackToPlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
            const { data } = await api.post<Playlist>(`/playlists/${playlistId}/tracks`, { trackId })
            return data
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['playlist', variables.playlistId], data)
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        },
    })
}

export const useRemoveTrackFromPlaylistMutation = (playlistId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (trackId: string) => {
            const { data } = await api.delete<Playlist>(`/playlists/${playlistId}/tracks/${trackId}`)
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['playlist', playlistId], data)
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        },
    })
}

/** Обновление плейлиста: название, описание, обложка (FormData) или новый порядок треков */
export const useUpdatePlaylistMutation = (playlistId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.put<Playlist>(`/playlists/${playlistId}`, formData)
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['playlist', playlistId], data)
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        },
    })
}

export const useDeletePlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (playlistId: string) => {
            const { data } = await api.delete(`/playlists/${playlistId}`)
            return data
        },
        onSuccess: (_data, playlistId) => {
            queryClient.removeQueries({ queryKey: ['playlist', playlistId] })
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        },
    })
}

const toggleIn = (ids: string[], trackId: string) =>
    ids.includes(trackId) ? ids.filter((id) => id !== trackId) : [...ids, trackId]

/** Лайк трека: сердце меняется сразу, при ошибке возвращается назад */
export const useToggleLikeQuery = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (trackId: string) => {
            const { data } = await api.post('/playlists/liked/toggle', { trackId })
            return data
        },
        onMutate: async (trackId: string) => {
            await queryClient.cancelQueries({ queryKey: ['my-playlists'] })
            const previous = queryClient.getQueryData<PlaylistSummary[]>(['my-playlists'])

            if (previous) {
                queryClient.setQueryData<PlaylistSummary[]>(
                    ['my-playlists'],
                    previous.map((p) => (isLikedPlaylist(p) ? { ...p, tracks: toggleIn(p.tracks ?? [], trackId) } : p))
                )
            }
            return { previous }
        },
        onError: (error, _trackId, context) => {
            if (context?.previous) queryClient.setQueryData(['my-playlists'], context.previous)
            toast.error(apiError(error, 'Не удалось изменить лайк'))
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
            queryClient.invalidateQueries({ queryKey: ['playlist'] })
        },
    })
}