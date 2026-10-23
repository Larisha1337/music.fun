import { mediaUrl } from '@/shared/ui/lib/media-url.ts'

type Props = {
    coverUrl?: string | null
    previewCovers?: string[]
    isSystem?: boolean
    className?: string
}

const Img = ({ src }: { src: string }) => (
    <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
)

export const PlaylistCover = ({ coverUrl, previewCovers = [], isSystem, className = '' }: Props) => {
    const own = mediaUrl(coverUrl)
    const previews = previewCovers.map((u) => mediaUrl(u)).filter((u): u is string => Boolean(u))

    let content
    if (own) {
        content = <Img src={own} />
    } else if (isSystem) {
        content = (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-pink-200 via-pink-400 to-pink-600">
                <svg className="h-1/2 w-1/2 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 2.8 4.5 6.4 4.5c2 0 3.5 1 4.6 2.6l1 1.4 1-1.4c1.1-1.6 2.6-2.6 4.6-2.6 3.6 0 5.5 3.8 4 7.3C19.5 16.4 12 21 12 21z" />
                </svg>
            </div>
        )
    } else if (previews.length >= 4) {
        content = (
            <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                {previews.slice(0, 4).map((u) => (
                    <Img key={u} src={u} />
                ))}
            </div>
        )
    } else if (previews.length >= 2) {
        content = (
            <div className="grid h-full w-full grid-cols-2">
                {previews.slice(0, 2).map((u) => (
                    <Img key={u} src={u} />
                ))}
            </div>
        )
    } else if (previews[0]) {
        content = <Img src={previews[0]} />
    } else {
        content = (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-pink-300/25 to-pink-600/10">
                <svg className="h-1/3 w-1/3 text-pink-200/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
        )
    }

    return <div className={`relative overflow-hidden bg-pink-300/[0.07] ${className}`}>{content}</div>
}