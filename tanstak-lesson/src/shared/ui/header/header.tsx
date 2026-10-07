import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import styles from '../../../app/layouts/root-layout.module.css'

type Props = {
    renderAccountBar: () => ReactNode
}

const MusicIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const ListIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7m6-4v6m-3-3h6" />
    </svg>
)

type NavLinkProps = {
    to: string
    label: string
    icon: ReactNode
}

const NavLink = ({ to, label, icon }: NavLinkProps) => (
    <Link
        to={to}
        className="group relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-semibold tracking-wide
                   text-zinc-400 transition-all duration-300
                   hover:bg-white/5 hover:-translate-y-0.5 active:scale-95
                   data-[status=active]:text-white data-[status=active]:bg-white/[0.07]"
    >
        {/* Иконка: оживает при наведении */}
        <span className="transition-all duration-300 group-hover:text-indigo-400 group-hover:scale-110 group-hover:-rotate-6 group-data-[status=active]:text-indigo-400">
            {icon}
        </span>

        {/* Текст: бегущий градиент при наведении и для активной страницы */}
        <span
            className="bg-clip-text transition-all duration-300
               bg-[linear-gradient(90deg,#a1a1aa,#a1a1aa)]
               group-hover:text-transparent group-hover:bg-[linear-gradient(90deg,#818cf8,#c084fc,#f472b6,#818cf8)]
               group-hover:bg-[length:200%_100%] group-hover:animate-nav-shine
               group-data-[status=active]:text-transparent group-data-[status=active]:bg-[linear-gradient(90deg,#818cf8,#c084fc,#f472b6,#818cf8)]
               group-data-[status=active]:bg-[length:200%_100%] group-data-[status=active]:animate-nav-shine"
        >
    {label}
</span>

        {/* Подчёркивание: растёт от центра */}
        <span
            className="pointer-events-none absolute bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full
                       bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400
                       shadow-[0_0_10px_rgba(167,139,250,0.8)]
                       transition-all duration-300 ease-out
                       group-hover:w-3/4 group-data-[status=active]:w-3/4"
        />
    </Link>
)

export const Header = ({ renderAccountBar }: Props) => (
    <header className="sticky top-0 z-50 bg-zinc-950/60 backdrop-blur-xl transition-all duration-300 relative">
        <div className={styles.container}>
            {/* Ссылки слева */}
            <nav className="flex items-center gap-1 sm:gap-2">
                <NavLink to="/all-tracks" label="Tracks" icon={<MusicIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />} />
                <NavLink to="/playlists" label="Playlists" icon={<ListIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />} />
            </nav>

            {/* Аккаунт справа */}
            {renderAccountBar()}
        </div>

        {/* Светящаяся линия внизу хедера вместо обычной серой границы */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
    </header>
)