import { api } from './axiosInstance' // твой настроенный axios с авторизационным заголовком Bearer

export interface Playlist {
    _id: string
    name: string
    description?: string
    coverUrl?: string | null
    tracks?: any[] // массив с деталями треков
    ownerId?: string
    createdAt?: string
}

export const playlistApi = {
    // 1. Мои плейлисты
    getMyPlaylists: async (): Promise<Playlist[]> => {
        const { data } = await api.get('/playlists')
        return data
    },

    // 2. Конкретный плейлист
    getPlaylistById: async (id: string): Promise<Playlist> => {
        const { data } = await api.get(`/playlists/${id}`)
        return data
    },

    // 3. Создать
    createPlaylist: async (payload: { name: string; description?: string; coverUrl?: string }) => {
        const { data } = await api.post('/playlists', payload)
        return data
    },

    // 4. Обновить
    updatePlaylist: async ({ id, ...payload }: { id: string; name?: string; description?: string; coverUrl?: string }) => {
        const { data } = await api.put(`/playlists/${id}`, payload)
        return data
    },

    // 5. Удалить
    deletePlaylist: async (id: string) => {
        const { data } = await api.delete(`/playlists/${id}`)
        return data
    },

    // 6. Добавить трек
    addTrack: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
        const { data } = await api.post(`/playlists/${playlistId}/tracks`, { trackId })
        return data
    },

    // 7. Удалить трек
    removeTrack: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
        const { data } = await api.delete(`/playlists/${playlistId}/tracks/${trackId}`)
        return data
    }
}