import { useMutation, useQueryClient } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

export const useLogoutMutation = () => {
    const queryClient = useQueryClient()

    return useMutation<unknown, Error, void>({
        mutationFn: async () => {
            localStorage.removeItem(localStorageKey.accessToken)
        },
        onSuccess: () => {
            queryClient.setQueryData(['me'], null)
            queryClient.invalidateQueries({ queryKey: ['me'] })
        }
    })
}