import { useEffect, useRef } from 'react'

type Range = { start: number; end: number }

export const useTrimPlayback = (
    audioRef: React.RefObject<HTMLAudioElement | null>,
    trim: Range | null | undefined,
    onEnd: () => void
) => {
    const onEndRef = useRef(onEnd)

    useEffect(() => {
        onEndRef.current = onEnd
    })

    const start = trim?.start
    const end = trim?.end

    useEffect(() => {
        const audio = audioRef.current
        if (!audio || start === undefined || end === undefined) return

        let fired = false

        const tick = () => {
            if (audio.readyState < 1) return
            const t = audio.currentTime

            // Позиция левее отрезка (старт трека или перемотка назад): возвращаем на начало
            if (t < start - 0.3) {
                audio.currentTime = start
                fired = false
                return
            }

            if (fired) {
                if (t < end - 0.5) fired = false
                return
            }

            // Если отрезок заканчивается вместе с треком, конец обработает сам <audio>
            const nearNaturalEnd = Number.isFinite(audio.duration) && end >= audio.duration - 0.25
            if (nearNaturalEnd) return

            if (t >= end) {
                fired = true
                audio.pause()
                onEndRef.current()
            }
        }

        const id = window.setInterval(tick, 100)
        tick()
        return () => window.clearInterval(id)
    }, [audioRef, start, end])
}