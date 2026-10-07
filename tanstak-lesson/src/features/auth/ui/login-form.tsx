import { useState } from 'react'
import { LoginModal } from './modal/login-modal.tsx'

export const LoginForm = () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-5 sm:px-6 py-2 rounded-full text-sm font-semibold text-white whitespace-nowrap cursor-pointer
                           bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600
                           shadow-lg shadow-indigo-500/25 transition-all duration-300
                           hover:shadow-indigo-500/45 hover:-translate-y-0.5 active:scale-95
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
                Войти
            </button>

            {/* Монтируем только когда открыто, поэтому поля и ошибки сбрасываются при каждом открытии */}
            {isOpen && <LoginModal onClose={() => setIsOpen(false)} />}
        </>
    )
}