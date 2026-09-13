import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const API_BASE = 'https://musicfun.it-incubator.app/api/1.0'

export type UploadTrackFormValues = {
    title: string
    file: FileList
    playlistId?: string
}

export const useUploadTrackMutation = (onSuccess?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: UploadTrackFormValues) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const file = formData.file?.[0]

            if (!file) {
                throw new Error('Файл не выбран')
            }

            const body = new FormData()
            body.append('title', formData.title)
            body.append('file', file)

            if (formData.playlistId) {
                body.append('playlistId', formData.playlistId)
            }

            const response = await fetch(`${API_BASE}/playlists/tracks/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body
            })

            if (!response.ok) {
                const errorData = await response.json()
                const message = errorData?.errors?.[0]?.detail ?? errorData?.title ?? 'Не удалось загрузить трек'
                throw new Error(message)
            }

            return response.json()
        },
        onSuccess: () => {
            // Обязательно инвалидируем ключи плейлистов, чтобы список перезапросился
            queryClient.invalidateQueries({ queryKey: ['playlists'] })
            queryClient.invalidateQueries({ queryKey: ['tracks'] })
            onSuccess?.()
        }
    })
}