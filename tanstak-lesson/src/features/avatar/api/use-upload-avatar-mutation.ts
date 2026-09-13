import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'
import { avatarKeys } from './use-avatar-query.ts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://musicfun.it-incubator.app/api/1.0'
const API_KEY = import.meta.env.VITE_API_KEY

export const useUploadAvatarMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (file: File) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const formData = new FormData()
            formData.append('avatar', file)

            const response = await fetch(`${API_BASE}/playlists/tracks/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Api-key': API_KEY, // <-- ДОБАВЬ ЭТОТ ЗАГОЛОВОК
                },
                body: formData
            })

            if (!response.ok) throw new Error('Не удалось загрузить аватарку')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: avatarKeys.avatar })
        }
    })
}