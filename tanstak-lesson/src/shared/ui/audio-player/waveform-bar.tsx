import { memo, useEffect, useRef } from 'react'

type Props = {
    audioRef: React.RefObject<HTMLAudioElement | null>
    peaks: number[]
    duration: number
    isSeekable: boolean
    color: string
    src: string
    onTimeUpdate?: (time: number) => void
}

const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export const WaveformBar = memo(({ audioRef, peaks, duration, isSeekable, color, src, onTimeUpdate }: Props) => {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const timeRef = useRef<HTMLSpanElement>(null)
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
    const hoverRef = useRef<number | null>(null)
    const draggingRef = useRef(false)
    const dirtyRef = useRef(true)

    // Размер canvas под контейнер (и под PiP-окно: берём window того документа, где лежит элемент)
    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return

        const win = wrap.ownerDocument.defaultView ?? window

        const apply = () => {
            const rect = wrap.getBoundingClientRect()
            const dpr = Math.min(win.devicePixelRatio || 1, 2)
            sizeRef.current = { w: rect.width, h: rect.height, dpr }
            canvas.width = Math.max(1, Math.round(rect.width * dpr))
            canvas.height = Math.max(1, Math.round(rect.height * dpr))
            dirtyRef.current = true
        }

        apply()
        const observer = new win.ResizeObserver(apply)
        observer.observe(wrap)
        return () => observer.disconnect()
    }, [])

    // Отрисовка: перерисовываем только когда что-то изменилось
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        let rafId = 0
        let lastKey = ''
        dirtyRef.current = true

        const tick = () => {
            rafId = requestAnimationFrame(tick)

            const audio = audioRef.current
            const time = audio?.currentTime ?? 0
            const { w, h, dpr } = sizeRef.current
            if (!w || !h) return

            const dur = duration || audio?.duration || 0
            const progress = dur > 0 && Number.isFinite(dur) ? Math.min(1, time / dur) : 0
            const hover = hoverRef.current

            const key = `${Math.round(progress * 4000)}|${hover === null ? -1 : Math.round(hover * 400)}|${w}|${h}`
            if (key !== lastKey || dirtyRef.current) {
                lastKey = key
                dirtyRef.current = false

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                ctx.clearRect(0, 0, w, h)

                const n = peaks.length
                const slot = w / n
                const barW = Math.max(1, slot * 0.62)
                const radius = Math.min(barW / 2, 2)

                for (let i = 0; i < n; i++) {
                    const barH = Math.max(3, (peaks[i] ?? 0) * (h - 2))
                    const x = i * slot + (slot - barW) / 2
                    const y = (h - barH) / 2
                    const center = (i + 0.5) / n

                    if (center <= progress) {
                        ctx.fillStyle = color
                        ctx.globalAlpha = 1
                    } else if (hover !== null && center <= hover) {
                        ctx.fillStyle = color
                        ctx.globalAlpha = 0.45
                    } else {
                        ctx.fillStyle = '#ffffff'
                        ctx.globalAlpha = 0.2
                    }

                    ctx.beginPath()
                    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, radius)
                    else ctx.rect(x, y, barW, barH)
                    ctx.fill()
                }
                ctx.globalAlpha = 1
            }

            if (timeRef.current) timeRef.current.textContent = formatTime(time)
            onTimeUpdate?.(time)
        }

        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [audioRef, peaks, duration, color, onTimeUpdate])

    const ratioFromEvent = (clientX: number) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) return 0
        return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    }

    const seekTo = (ratio: number) => {
        const audio = audioRef.current
        if (!audio) return
        const dur = duration || audio.duration
        if (!dur || !Number.isFinite(dur)) return

        const time = ratio * dur
        audio.currentTime = time
        onTimeUpdate?.(time)
        localStorage.setItem(`player-time-${src}`, String(time))
    }

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isSeekable) return
        e.currentTarget.setPointerCapture(e.pointerId)
        draggingRef.current = true
        seekTo(ratioFromEvent(e.clientX))
    }

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const ratio = ratioFromEvent(e.clientX)
        hoverRef.current = isSeekable ? ratio : null
        if (draggingRef.current) seekTo(ratio)
    }

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        draggingRef.current = false
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
            /* указатель уже отпущен */
        }
    }

    return (
        <div className="flex flex-col w-full gap-1">
            <div ref={wrapRef} className="relative w-full h-9">
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label="Волна трека. Нажмите, чтобы перемотать"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onPointerLeave={() => {
                        hoverRef.current = null
                    }}
                    style={{ touchAction: 'none' }}
                    className={`absolute inset-0 w-full h-full ${isSeekable ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 font-medium px-0.5">
                <span ref={timeRef}>0:00</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    )
})

WaveformBar.displayName = 'WaveformBar'