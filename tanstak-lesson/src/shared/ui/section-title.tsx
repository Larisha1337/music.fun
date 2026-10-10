import type { ReactNode } from 'react'

type Props = {
    icon: ReactNode
    children: ReactNode
    action?: ReactNode
}

export const SectionTitle = ({ icon, children, action }: Props) => (
    <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 min-w-0 font-display text-sm sm:text-lg font-extrabold uppercase tracking-wide text-white">
            <span className="shrink-0 text-pink-300 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">{icon}</span>
            <span className="truncate">{children}</span>
        </h2>
        {action}
    </div>
)

const base = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 } as const

export const IconLayers = () => (
    <svg {...base}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />
    </svg>
)

export const IconHistory = () => (
    <svg {...base}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-3-6.7M21 4v5h-5" />
    </svg>
)

export const IconSpark = () => (
    <svg {...base}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
    </svg>
)