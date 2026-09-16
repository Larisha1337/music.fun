import { createFileRoute } from '@tanstack/react-router'
import MyTracksPage from '../pages/my-tracks-page.tsx'

export const Route = createFileRoute('/my-tracks')({
  component: MyTracksPage,
})