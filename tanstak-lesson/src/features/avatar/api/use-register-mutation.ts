import { useMutation } from '@tanstack/react-query'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

export const useRegisterMutation = (onSuccess?: () => void) => {
    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const response = await fetch(`${MY_API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message ?? 'Ошибка регистрации')
            }
            return response.json()
        },
        onSuccess: (data) => {
            localStorage.setItem(localStorageKey.accessToken, data.token)
            onSuccess?.()
        }
    })
}