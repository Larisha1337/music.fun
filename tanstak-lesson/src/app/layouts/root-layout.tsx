import { Outlet } from '@tanstack/react-router'
import { Header } from "../../shared/ui/header/header.tsx";
import styles from './root-layout.module.css'
import { AccountBar } from "../../features/auth/ui/account-bar.tsx";

// 1. Импортируем Провайдер и сам Плеер
import { AudioPlayerProvider } from "@/shared/ui/lib/audio-player-context";
import { GlobalPlayer } from "@/widget/global-player/ui/global-player.tsx";

export const RootLayout = () => (
    <AudioPlayerProvider>

        <div className="pb-28 min-h-screen">
            <Header renderAccountBar={() => <AccountBar/> }/>
            <div className={styles.container}>
                <Outlet />
            </div>
        </div>
        <GlobalPlayer />

    </AudioPlayerProvider>
)