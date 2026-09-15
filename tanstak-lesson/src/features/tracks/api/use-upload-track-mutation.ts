import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://musicfun.it-incubator.app/api/1.0'
const API_KEY = import.meta.env.VITE_API_KEY

export type UploadTrackFormValues = {
    title: string
    file: File | FileList
    playlistId?: string
}

export const useUploadTrackMutation = (onSuccess?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: UploadTrackFormValues) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const file = formData.file instanceof FileList ? formData.file[0] : formData.file

            if (!file) {
                throw new Error('Файл не выбран')
            }

            const body = new FormData()
            body.append('title', formData.title)
            body.append('file', file)

            // Возвращаем корректный рабочий URL
            const response = await fetch(`${API_BASE}/playlists/tracks/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'api-key': API_KEY || '',
                },
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
            queryClient.invalidateQueries({ queryKey: ['playlists'] })
            queryClient.invalidateQueries({ queryKey: ['tracks'] })
            onSuccess?.()
        }
    })
}