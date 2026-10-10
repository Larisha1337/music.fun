import { useEffect, useRef, type CSSProperties } from 'react'

interface TrackSearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
)

const ClearIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

// Отступы заданы инлайном, чтобы глобальные стили на input их не перебили
const inputStyle: CSSProperties = { paddingLeft: 44, paddingRight: 44 }

export const TrackSearch = ({
                                value,
                                onChange,
                                placeholder = 'Поиск по названию или исполнителю...'
                            }: TrackSearchProps) => {
    const inputRef = useRef<HTMLInputElement>(null)

    // Быстрый поиск: «/» или Ctrl+K (Cmd+K) ставят курсор в поле
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null
            const typing =
                !!target &&
                (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

            const isCtrlK = (e.ctrlKey || e.metaKey) && e.code === 'KeyK'
            // По физической клавише: работает и на русской раскладке
            const isSlash = e.code === 'Slash' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !typing

            if (isCtrlK || isSlash) {
                e.preventDefault()
                inputRef.current?.focus()
                inputRef.current?.select()
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            if (value) onChange('')
            else e.currentTarget.blur()
        }
    }

    return (
        <div className="relative max-w-4xl mx-auto w-full mb-4">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 pointer-events-none" />

            <input
                ref={inputRef}
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label="Поиск треков"
                style={inputStyle}
                className="w-full py-3 bg-zinc-950/60 backdrop-blur-xl border border-zinc-900 focus:border-indigo-500/50 rounded-2xl text-zinc-100 placeholder-zinc-500 text-base outline-none appearance-none transition-all shadow-lg focus:shadow-[0_0_20px_rgba(249, 92, 158,0.15)] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />

            {value ? (
                <button
                    type="button"
                    onClick={() => {
                        onChange('')
                        inputRef.current?.focus()
                    }}
                    aria-label="Очистить поиск"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <ClearIcon className="w-4 h-4" />
                </button>
            ) : (
                <kbd
                    aria-hidden="true"
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-6 min-w-6 px-1.5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[11px] font-mono text-zinc-500 pointer-events-none"
                >
                    /
                </kbd>
            )}
        </div>
    )
}