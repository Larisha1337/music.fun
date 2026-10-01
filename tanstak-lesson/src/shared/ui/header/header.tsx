// shared/ui/header.tsx
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import styles from '../../../app/layouts/root-layout.module.css' // Подключаем CSS-модуль хедера

type Props = {
    renderAccountBar: () => ReactNode
}

export const Header = ({ renderAccountBar }: Props) => (
    <header className="sticky top-0 z-50  backdrop-blur-xl border-b border-white/10 transition-all duration-300">
        {/* 👈 Вешаем класс контейнера сюда */}
        <div className={styles.container}>

            {/* Ссылки влево */}
            <div className={styles.nav}>
                <Link to="/all-tracks">Tracks</Link>
                <Link to="/playlists">Playlists</Link>
            </div>

            {/* 👈 Вызываем renderAccountBar, чтобы отрисовать <div>Account</div> справа */}
            {renderAccountBar()}

        </div>
    </header>
)