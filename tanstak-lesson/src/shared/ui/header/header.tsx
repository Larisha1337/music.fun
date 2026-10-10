import { useEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import styles from '../../../app/layouts/root-layout.module.css' // <- оставь свою строку как была
import { Sakura, SakuraToggle } from '@/shared/ui/sakura.tsx'
import { ComposeEntry } from '@/features/tracks/ui/compose/compose-modal.tsx'

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
        aria-label={label}
        className="group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold text-zinc-400 transition-colors
                   hover:text-white hover:bg-white/5
                   data-[status=active]:text-white data-[status=active]:bg-white/[0.08]"
    >
        <span className="text-zinc-500 transition-colors group-hover:text-pink-300 group-data-[status=active]:text-pink-300">
            {icon}
        </span>
        {/* На очень узких экранах остаются только иконки */}
        <span className="hidden min-[420px]:inline">{label}</span>
    </Link>
)

export const Header = ({ renderAccountBar }: Props) => {
    // Вверху страницы шапка прозрачная, при прокрутке размывается (как у Anivox)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 border-b ${
                scrolled ? 'bg-zinc-950/75 backdrop-blur-xl border-white/5' : 'bg-transparent border-transparent'
            }`}
        >
            <div className={styles.container}>
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                    <Link
                        to="/all-tracks"
                        aria-label="На главную"
                        className="shrink-0 grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-300 to-pink-500
                                   shadow-[0_6px_20px_-6px_rgba(249,92,158,0.8)] transition-transform hover:scale-105 active:scale-95"
                    >
                        <MusicIcon className="w-5 h-5 text-white" />
                    </Link>

                    <nav className="flex items-center gap-0.5 sm:gap-1">
                        <NavLink to="/all-tracks" label="Tracks" icon={<MusicIcon className="w-[18px] h-[18px]" />} />
                        <NavLink to="/playlists" label="Playlists" icon={<ListIcon className="w-[18px] h-[18px]" />} />
                    </nav>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <ComposeEntry />
                    <SakuraToggle />
                    {renderAccountBar()}
                </div>
            </div>

            <Sakura />
        </header>
    )
}