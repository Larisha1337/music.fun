import type { TrackInfo } from '@/shared/ui/lib/audio-player-context'

export const pluralTracks = (n: number) => {
    const m10 = n % 10
    const m100 = n % 100
    const word =
        m10 === 1 && m100 !== 11 ? 'трек' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'трека' : 'треков'
    return `${n} ${word}`
}

type Playable = {
    _id: string
    title: string
    artist?: string
    fileUrl?: string
    audioUrl?: string
    coverUrl?: string | null
}

/** Треки из API → очередь плеера (исполнителя без значения плеер сам достаёт из названия) */
export const toQueue = (tracks: Playable[]): TrackInfo[] =>
    tracks.map((t) => ({
        _id: t._id,
        title: t.title,
        artist: t.artist,
        fileUrl: t.fileUrl || t.audioUrl || '',
        coverUrl: t.coverUrl,
    }))