import { Outlet} from '@tanstack/react-router'
import {Header} from "../../shared/ui/header/header.tsx";
import styles from './root-layout.module.css'
import {LoginButton} from "../../features/auth/ui/login-button.tsx";

export const RootLayout = () => (
        <>
            <Header renderAccountBar={() => <LoginButton/> }/>
            <div className={styles.container}>
                <Outlet />
            </div>
        </>
)

