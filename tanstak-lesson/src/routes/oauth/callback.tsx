import { createFileRoute } from '@tanstack/react-router'
import OAuthCallbackPage from "../../pages/auth/auth-callback-pages.tsx";

export const Route = createFileRoute('/oauth/callback')({
    component: OAuthCallbackPage,
})

