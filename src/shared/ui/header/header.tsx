// shared/ui/header.tsx
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import styles from '../../../app/layouts/root-layout.module.css' // Подключаем CSS-модуль хедера

type Props = {
    renderAccountBar: () => ReactNode
}

export const Header = ({ renderAccountBar }: Props) => (
    <header>
        {/* 👈 Вешаем класс контейнера сюда */}
        <div className={styles.container}>

            {/* Ссылки влево */}
            <div className={styles.nav}>
                <Link to="/">Playlists</Link>
                <Link to="/my-playlists"> My playlists </Link>
                <Link to="/oauth/callback"> temp page </Link>
            </div>

            {/* 👈 Вызываем renderAccountBar, чтобы отрисовать <div>Account</div> справа */}
            {renderAccountBar()}

        </div>
    </header>
)