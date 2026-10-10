import { useState } from 'react'
import { LoginModal } from './modal/login-modal.tsx'

export const LoginForm = () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button type="button" onClick={() => setIsOpen(true)} className="btn-accent">
                Войти
            </button>

            {/* Монтируем только когда открыто, поэтому поля и ошибки сбрасываются при каждом открытии */}
            {isOpen && <LoginModal onClose={() => setIsOpen(false)} />}
        </>
    )
}