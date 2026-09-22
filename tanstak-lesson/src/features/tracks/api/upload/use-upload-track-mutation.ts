import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export type UploadTrackFormValues = {
    title: string;
    file: FileList;
    cover?: FileList;
}

export const useUploadTrackMutation = (onSuccess?: () => void) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (formData: UploadTrackFormValues) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const file = formData.file?.[0]
            if (!file) throw new Error('Файл не выбран')

            const body = new FormData()
            body.append('title', formData.title)
            body.append('file', file)

            const response = await fetch(`${MY_API_BASE}/api/tracks`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Не удалось загрузить трек')
            }

            const result = await response.json()
            const trackId = result.track?._id

            // Загрузка обложки отдельным запросом
            const coverFile = formData.cover?.[0]
            if (coverFile && trackId) {
                const coverBody = new FormData()
                coverBody.append('cover', coverFile) // Передаем 'coverFile' (TypeScript знает, что это File)

                const coverResponse = await fetch(`${MY_API_BASE}/api/tracks/${trackId}/cover`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: coverBody
                })

                if (coverResponse.ok) {
                    return coverResponse.json()
                }
                console.warn('Трек создан, но обложка не загрузилась')
            }

            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            queryClient.invalidateQueries({ queryKey: ['all-tracks'] })

            onSuccess?.()
        }
    })
}