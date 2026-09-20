import { useState } from 'react'
import { useLoginMutation } from '@/features/auth/api/use-login-mutation'
import { useRegisterMutation } from '@/features/avatar/api/use-register-mutation'

export const LoginForm = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const loginMutation = useLoginMutation()
    const registerMutation = useRegisterMutation()
    const mutation = mode === 'login' ? loginMutation : registerMutation

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({ email, password })
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="px-3 py-1.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="px-3 py-1.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
                type="submit"
                disabled={mutation.isPending}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50"
            >
                {mutation.isPending ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
            <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
                {mode === 'login' ? 'Нет аккаунта?' : 'Есть аккаунт?'}
            </button>
            {mutation.isError && (
                <span className="text-xs text-red-400">{mutation.error.message}</span>
            )}
        </form>
    )
}