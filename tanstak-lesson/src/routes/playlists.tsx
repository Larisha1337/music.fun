// src/routes/playlists.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PlaylistsSidebar } from '@/pages/PlaylistsList.tsx' // Подправь путь
import { useState, useRef, useCallback } from 'react'

export const Route = createFileRoute('/playlists')({
    component: PlaylistsLayout,
})

function PlaylistsLayout() {
    // Начальная ширина сайдбара (например, 384px — это твой текущий размер w-96)
    const [sidebarWidth, setSidebarWidth] = useState(384)
    const isResizing = useRef(false)

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        isResizing.current = true

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return

            // Вычисляем новую ширину по движению мыши
            const newWidth = moveEvent.clientX

            // Минимальный лимит (например, 260px), максимальный — текущий размер (384px) или больше по вкусу
            const minWidth = 260
            const maxWidth = 500

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            isResizing.current = false
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }, [])

    return (
        <div className="flex gap-2 px-2 pb-2 w-full h-[calc(100vh-76px)] overflow-hidden select-none">
            {/* Левая панель с динамической шириной */}
            <aside
                style={{ width: `${sidebarWidth}px` }}
                className="shrink-0 h-full flex flex-col bg-[#121212] rounded-xl border border-[#27272a]/50 overflow-hidden relative"
            >
                <PlaylistsSidebar />

                {/* Ручка (divider) для перетаскивания мышкой */}
                <div
                    onMouseDown={startResizing}
                    className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-10"
                    title="Потяните, чтобы изменить размер"
                />
            </aside>

            {/* Правая часть занимает всю оставшуюся ширину */}
            <main className="flex-1 h-full bg-[#121212] rounded-xl border border-[#27272a]/50 overflow-y-auto custom-scrollbar">
                <Outlet />
            </main>
        </div>
    )
}