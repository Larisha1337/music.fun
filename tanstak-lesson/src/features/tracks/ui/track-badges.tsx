import { toCamelot, camelotColor } from '@/shared/ui/lib/music-key.ts'

type Props = {
    bpm?: number | null
    musicalKey?: string | null
}

export const TrackBadges = ({ bpm, musicalKey }: Props) => {
    if (!bpm && !musicalKey) return null

    const camelot = toCamelot(musicalKey)
    const color = camelot ? camelotColor(camelot) : undefined

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {bpm ? (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-400/20">
                    {Math.round(bpm)} BPM
                </span>
            ) : null}

            {musicalKey ? (
                <span
                    title={camelot ? `Camelot ${camelot}` : undefined}
                    style={color ? { color, borderColor: `${color.slice(0, -1)} / 0.35)`, backgroundColor: `${color.slice(0, -1)} / 0.1)` } : undefined}
                    className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold border border-white/10 bg-white/5 text-zinc-300"
                >
                    {musicalKey}
                    {camelot ? ` · ${camelot}` : ''}
                </span>
            ) : null}
        </div>
    )
}