import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLoginMutation } from '@/features/auth/api/use-login-mutation'
import { useRegisterMutation } from '@/features/avatar/api/use-register-mutation'

type Props = {
    onClose: () => void
}

type Mode = 'login' | 'register'

const MailIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
)

const EyeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
)

const EyeOffIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
)

const CloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const MusicIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

/**
 * Следим за видимой областью экрана. Когда на телефоне выезжает клавиатура,
 * высота уменьшается: окно подстраивается и не прячется под клавиатурой.
 */
const useVisualViewport = () => {
    const getInitial = () => ({
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
        offsetTop: 0,
    })
    const [vv, setVv] = useState(getInitial)
    const baseHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 800)

    useEffect(() => {
        const viewport = window.visualViewport
        if (!viewport) return

        const update = () => setVv({ height: viewport.height, offsetTop: viewport.offsetTop })
        update()

        viewport.addEventListener('resize', update)
        viewport.addEventListener('scroll', update)
        return () => {
            viewport.removeEventListener('resize', update)
            viewport.removeEventListener('scroll', update)
        }
    }, [])

    // Клавиатура считается открытой, если видимая область сжалась больше чем на четверть
    const keyboardOpen = vv.height < baseHeightRef.current * 0.75

    return { ...vv, keyboardOpen }
}

// text-base на телефоне (16px): иначе iPhone приближает страницу при фокусе на поле.
// Последние две строки перекрашивают светлый фон автозаполнения Chrome.
const inputClass =
    'w-full py-3.5 sm:py-3 rounded-xl text-base sm:text-sm text-white placeholder-zinc-500 caret-white ' +
    'bg-white/[0.04] outline-none ' +
    'transition-shadow duration-300 focus:ring-4 focus:ring-indigo-500/25 ' +
    '[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] ' +
    '[&:-webkit-autofill]:shadow-[0_0_0_1000px_#18181b_inset]'

// Рамка и отступы заданы инлайном, чтобы глобальные стили на input их не перебили
const inputBase: CSSProperties = {
    border: '1px solid rgba(255, 255, 255, 0.12)',
    paddingLeft: 44,
}
const inputStyle: CSSProperties = { ...inputBase, paddingRight: 16 }
const inputStyleWithEye: CSSProperties = { ...inputBase, paddingRight: 48 }

const iconClass =
    'absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 pointer-events-none'

const gradientStyle: CSSProperties = {
    backgroundImage: 'linear-gradient(90deg, #4f46e5, #7c3aed, #c026d3)',
    color: '#fff',
}

// Отступы окна от краёв с учётом «чёлки» и жестовой панели
const wrapperPadding: CSSProperties = {
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(12px, env(safe-area-inset-left))',
    paddingRight: 'max(12px, env(safe-area-inset-right))',
}

export const LoginModal = ({ onClose }: Props) => {
    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    const emailRef = useRef<HTMLInputElement>(null)
    const { height, offsetTop, keyboardOpen } = useVisualViewport()

    const loginMutation = useLoginMutation()
    const registerMutation = useRegisterMutation()
    const mutation = mode === 'login' ? loginMutation : registerMutation

    const isRegister = mode === 'register'
    const error = localError ?? (mutation.isError ? mutation.error?.message : null)

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)

        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        // Автофокус только на компьютере: на телефоне он сразу поднял бы клавиатуру
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            emailRef.current?.focus()
        }

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prevOverflow
        }
    }, [onClose])

    // На телефоне подводим активное поле в центр видимой области (после выезда клавиатуры)
    const handleFieldFocus = (e: FocusEvent<HTMLInputElement>) => {
        if (!window.matchMedia('(max-width: 639px)').matches) return
        const el = e.currentTarget
        window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
    }

    const switchMode = (next: Mode) => {
        if (next === mode) return
        setMode(next)
        setLocalError(null)
        setConfirm('')
        loginMutation.reset()
        registerMutation.reset()
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)

        if (isRegister && password !== confirm) {
            setLocalError('Пароли не совпадают')
            return
        }

        mutation.mutate({ email, password }, { onSuccess: onClose })
    }

    // Логотип и подзаголовок прячем на низких экранах и пока открыта клавиатура
    const compact = keyboardOpen

    return createPortal(
        <div
            className="fixed left-0 right-0 z-[10000] overflow-y-auto overscroll-contain"
            style={{ top: offsetTop, height }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            {/* Затемнение фона */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

            {/* Окно по центру видимой области. Клик мимо карточки закрывает */}
            <div
                className="relative flex min-h-full items-center justify-center"
                style={wrapperPadding}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose()
                }}
            >
                {/* Карточка с градиентной рамкой */}
                <div className="relative w-full max-w-md animate-modal-in rounded-3xl p-px bg-gradient-to-br from-indigo-500/60 via-white/10 to-fuchsia-500/60 shadow-[0_30px_80px_-10px_rgba(99,102,241,0.35)]">
                    <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-zinc-950 p-4 min-[380px]:p-5 sm:p-8 [@media(max-height:640px)]:p-4">
                        {/* Свечение на фоне */}
                        <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Закрыть"
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
                        >
                            <CloseIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>

                        <div className="relative">
                            {/* Логотип и заголовок */}
                            <div
                                className={`flex flex-col items-center text-center ${
                                    compact ? 'mb-3' : 'mb-4 min-[380px]:mb-5 sm:mb-6'
                                } [@media(max-height:640px)]:mb-3`}
                            >
                                <div
                                    className={`w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 items-center justify-center shadow-lg shadow-indigo-500/30 mb-3 sm:mb-4 [@media(max-height:640px)]:hidden ${
                                        compact ? 'hidden' : 'flex'
                                    }`}
                                >
                                    <MusicIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <h2
                                    id="auth-modal-title"
                                    className="px-8 sm:px-0 text-lg min-[380px]:text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-[linear-gradient(90deg,#818cf8,#c084fc,#f472b6,#818cf8)] bg-[length:200%_100%] animate-nav-shine"
                                >
                                    {isRegister ? 'Создать аккаунт' : 'С возвращением'}
                                </h2>
                                <p
                                    className={`text-xs min-[380px]:text-sm text-zinc-500 mt-1.5 [@media(max-height:640px)]:hidden ${
                                        compact ? 'hidden' : 'block'
                                    }`}
                                >
                                    {isRegister
                                        ? 'Загружай треки и собирай свои плейлисты'
                                        : 'Войди, чтобы слушать и загружать музыку'}
                                </p>
                            </div>

                            {/* Переключатель режима со скользящей плашкой */}
                            <div
                                className={`relative grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 ${
                                    compact ? 'mb-3' : 'mb-4 min-[380px]:mb-5 sm:mb-6'
                                } [@media(max-height:640px)]:mb-3`}
                            >
                                <span
                                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-indigo-600/80 to-violet-600/80 shadow-md transition-transform duration-300 ease-out ${
                                        isRegister ? 'translate-x-full' : 'translate-x-0'
                                    }`}
                                />
                                {(['login', 'register'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => switchMode(m)}
                                        className={`relative z-10 py-2.5 sm:py-2 text-[13px] min-[380px]:text-sm font-semibold rounded-lg transition-colors duration-300 cursor-pointer ${
                                            mode === m ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                                        }`}
                                    >
                                        {m === 'login' ? 'Вход' : 'Регистрация'}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-3.5">
                                {/* Email */}
                                <div className="relative">
                                    <MailIcon className={iconClass} />
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={handleFieldFocus}
                                        placeholder="Email"
                                        autoComplete="email"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        inputMode="email"
                                        enterKeyHint="next"
                                        required
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Пароль */}
                                <div className="relative">
                                    <LockIcon className={iconClass} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={handleFieldFocus}
                                        placeholder="Пароль"
                                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        enterKeyHint={isRegister ? 'next' : 'go'}
                                        required
                                        className={inputClass}
                                        style={inputStyleWithEye}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOffIcon className="w-5 h-5 sm:w-[18px] sm:h-[18px]" /> : <EyeIcon className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />}
                                    </button>
                                </div>

                                {/* Повтор пароля (только регистрация) */}
                                {isRegister && (
                                    <div className="relative animate-fade-in">
                                        <LockIcon className={iconClass} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            onFocus={handleFieldFocus}
                                            placeholder="Повтори пароль"
                                            autoComplete="new-password"
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            enterKeyHint="go"
                                            required
                                            className={inputClass}
                                            style={inputStyle}
                                        />
                                    </div>
                                )}

                                {/* Ошибка */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="animate-fade-in px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-sm text-rose-300"
                                    >
                                        {error}
                                    </div>
                                )}

                                {/* Кнопка отправки */}
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    style={gradientStyle}
                                    className="mt-1 w-full py-3.5 sm:py-3 rounded-xl text-base sm:text-sm font-semibold cursor-pointer border-0
                                               shadow-lg shadow-indigo-500/25 transition-all duration-300
                                               hover:shadow-indigo-500/45 hover:-translate-y-0.5 hover:brightness-110
                                               active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                                               focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                                >
                                    {mutation.isPending ? (
                                        <span className="inline-flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            Подождите...
                                        </span>
                                    ) : isRegister ? (
                                        'Создать аккаунт'
                                    ) : (
                                        'Войти'
                                    )}
                                </button>
                            </form>

                            {/* Нижняя подсказка */}
                            <p className="text-center text-[13px] min-[380px]:text-sm text-zinc-500 mt-3 sm:mt-5 [@media(max-height:640px)]:mt-2">
                                {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode(isRegister ? 'login' : 'register')}
                                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer py-2 px-1"
                                >
                                    {isRegister ? 'Войти' : 'Зарегистрироваться'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}