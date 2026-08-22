import { Outlet} from '@tanstack/react-router'
import {Header} from "../../shared/ui/header/header.tsx";
import styles from './root-layout.module.css'
import {AccountBar} from "../../features/auth/ui/account-bar.tsx";

export const RootLayout = () => (
        <>
            <Header renderAccountBar={() => <AccountBar/> }/>
            <div className={styles.container}>
                <Outlet />
            </div>
        </>
)

