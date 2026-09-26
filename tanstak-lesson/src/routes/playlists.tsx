import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PlaylistsSidebar } from '@/pages/PlaylistsList.tsx' // Подправь путь

export const Route = createFileRoute('/playlists')({
  component: PlaylistsLayout,
})

function PlaylistsLayout() {
  return (
      <div className="flex gap-6 p-6">
        {/* Сайдбар со списком плейлистов слева */}
        <div className="w-64 shrink-0">
          <PlaylistsSidebar />
        </div>

        {/* Справа рендерится конкретный выбранный плейлист из $playlistId.tsx */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
  )
}