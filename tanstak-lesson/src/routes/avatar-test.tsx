import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { login } from '../api/auth.ts' // путь подгони под свою структуру
import AvatarUpload from '../components/AvatarUpload.tsx'

export const Route = createFileRoute('/avatar-test')({
    component: TestAvatarPage,
})

function TestAvatarPage() {
    const [token, setToken] = useState<string | null>(null)

    const handleLogin = async () => {
        const t = await login('test@test.com', '123456')
        setToken(t)
    }

    return (
        <div>
            {!token ? (
                <button onClick={handleLogin}>Войти (тест)</button>
            ) : (
                <AvatarUpload token={token} />
            )}
        </div>
    )
}