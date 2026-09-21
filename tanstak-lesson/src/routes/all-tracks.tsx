import { createFileRoute } from '@tanstack/react-router'
import AllTracksPage from '../pages/all-tracks-page.tsx'

export const Route = createFileRoute('/all-tracks')({
    component: AllTracksPage,
})