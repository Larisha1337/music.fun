import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'
import { avatarKeys } from './use-avatar-query.ts'

export const useUploadAvatarMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (file: File) => {
            const token = localStorage.getItem(localStorageKey.accessToken)
            const formData = new FormData()
            formData.append('avatar', file)

            const response = await fetch('http://localhost:5000/api/user/avatar', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
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