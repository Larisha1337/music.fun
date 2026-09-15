import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export type UploadTrackFormValues = {
    title: string
    file: FileList
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

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tracks'] })
            onSuccess?.()
        }
    })
}