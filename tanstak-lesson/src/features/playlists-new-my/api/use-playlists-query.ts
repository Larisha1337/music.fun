import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'
import type {Track} from "@/features/tracks/ui/track-list.tsx";
import {api} from "@/shared/api/axiosInstance.ts";

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export interface Playlist {
    _id: string
    name: string
    description?: string
    coverUrl?: string | null
    tracks?: Track[]
}

const authHeaders = () => {
    const token = localStorage.getItem(localStorageKey.accessToken)
    return { Authorization: `Bearer ${token}` }
}

export const useMyPlaylistsQuery = () => {
    const token = localStorage.getItem(localStorageKey.accessToken)

    return useQuery({
        queryKey: ['my-playlists'],
        queryFn: async () => {
            const response = await fetch(`${MY_API_BASE}/api/playlists`, {
                headers: authHeaders()
            })
            if (!response.ok) throw new Error('Не удалось загрузить плейлисты')
            return response.json() as Promise<Playlist[]>
        },
        enabled: Boolean(token),
        retry: false
    })
}

export const useCreatePlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: FormData | { name: string; description?: string }) => {
            const isFormData = payload instanceof FormData

            // Формируем заголовки (для FormData НЕ добавляем Content-Type)
            const headers: Record<string, string> = {
                ...authHeaders()
            }

            if (!isFormData) {
                headers['Content-Type'] = 'application/json'
            }

            const response = await fetch(`${MY_API_BASE}/api/playlists`, {
                method: 'POST',
                headers,
                body: isFormData ? payload : JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось создать плейлист')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        }
    })
}

export const useAddTrackToPlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
            const response = await fetch(`${MY_API_BASE}/api/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось добавить трек')
            }
            return response.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] })
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        }
    })
}

export const usePlaylistQuery = (playlistId: string) => {
    const token = localStorage.getItem(localStorageKey.accessToken)

    return useQuery({
        queryKey: ['playlist', playlistId],
        queryFn: async () => {
            const { data } = await api.get<Playlist>(`/playlists/${playlistId}`)
            return data
        },
        enabled: Boolean(token) && Boolean(playlistId),
    })
}

// 1. Мутация удаления трека из плейлиста
export const useRemoveTrackFromPlaylistMutation = (playlistId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (trackId: string) => {
            const { data } = await api.delete(`/playlists/${playlistId}/tracks/${trackId}`)
            return data
        },
        onSuccess: () => {
            // Обновляем кэш текущего плейлиста, чтобы трек сразу исчез
            queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] })
        }
    })
}

// 2. Мутация обновления плейлиста (с поддержкой загрузки файла обложки)
export const useUpdatePlaylistMutation = (playlistId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.put(`/playlists/${playlistId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] })
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        }
    })
}

// 3. Мутация удаления всего плейлиста
export const useDeletePlaylistMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (playlistId: string) => {
            const { data } = await api.delete(`/playlists/${playlistId}`)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] })
        }
    })
}