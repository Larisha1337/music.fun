import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export type UploadTrackFormValues = {
    title: string;
    artist?: string;
    file?: FileList;
    cover?: FileList;
}

export const useUploadTrackMutation = (onSuccess?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: UploadTrackFormValues) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const data = new FormData()

            data.append('title', formData.title.trim())
            if (formData.artist) data.append('artist', formData.artist.trim())

            if (formData.file?.[0]) {
                data.append('file', formData.file[0])
            }
            if (formData.cover?.[0]) {
                data.append('cover', formData.cover[0])
            }

            const response = await fetch(`${MY_API_BASE}/api/tracks`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: data // Отправляем FormData вместо JSON
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось создать трек')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })
            onSuccess?.()
        }
    })
}