import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAudioPlayer } from '@/shared/ui/lib/audio-player-context'
import { PlayIcon } from '@/shared/ui/icons/player-icons'
import { toast } from '@/shared/ui/toast.tsx'
import { PlaylistCover } from './playlist-cover.tsx'
import { isLikedPlaylist, playlistQueryOptions, type PlaylistSummary } from '../api/use-playlists-query.ts'
import { pluralTracks, toQueue } from '../lib/format.ts'

export const PlaylistCard = ({ playlist }: { playlist: PlaylistSummary }) => {
    const queryClient = useQueryClient()
    const { playTrack } = useAudioPlayer()
    const [busy, setBusy] = useState(false)

    const count = playlist.tracks?.length ?? 0
    const liked = isLikedPlaylist(playlist)

    const warm = () => {
        void queryClient.prefetchQuery(playlistQueryOptions(playlist._id))
    }

    const play = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (busy) return

        setBusy(true)
        try {
            const full = await queryClient.fetchQuery(playlistQueryOptions(playlist._id))
            const queue = toQueue(full.tracks ?? [])
            const first = queue[0]
            if (!first) {
                toast.info('В плейлисте пока нет треков')
                return
            }
            playTrack(first, queue)
        } catch {
            toast.error('Не удалось запустить плейлист')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div onPointerEnter={warm} className="track-card group relative flex flex-col gap-3 rounded-2xl p-3 sm:p-4">
            <div className="relative">
                <Link
                    to="/playlists/$playlistId"
                    params={{ playlistId: playlist._id }}
                    className="block"
                    aria-label={`Открыть плейлист «${playlist.name}»`}
                >
                    <PlaylistCover
                        coverUrl={playlist.coverUrl}
                        previewCovers={playlist.previewCovers}
                        isSystem={liked}
                        className="aspect-square w-full rounded-xl shadow-lg ring-1 ring-pink-200/15"
                    />
                </Link>

                {liked && <span className="chip pointer-events-none absolute left-2 top-2 backdrop-blur-md">Любимое</span>}

                <button
                    type="button"
                    onClick={play}
                    disabled={busy || count === 0}
                    aria-label={`Слушать «${playlist.name}»`}
                    className="absolute bottom-2 right-2 grid h-11 w-11 translate-y-1 cursor-pointer place-items-center rounded-full bg-pink-300 text-zinc-950 opacity-0 shadow-[0_8px_24px_-6px_rgba(255,159,214,0.8)] transition-all duration-300 hover:scale-105 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 disabled:hidden [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
                >
                    {busy ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
                    ) : (
                        <PlayIcon className="h-5 w-5 translate-x-px" />
                    )}
                </button>
            </div>

            <Link to="/playlists/$playlistId" params={{ playlistId: playlist._id }} className="min-w-0">
                <span className="block truncate text-sm font-bold text-zinc-100 transition-colors group-hover:text-white sm:text-base" title={playlist.name}>
                    {playlist.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-400">{pluralTracks(count)}</span>
            </Link>
        </div>
    )
}