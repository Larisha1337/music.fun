import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { setSakura, useSakuraEnabled } from './sakura-store.ts'

type Petal = {
    x: number
    y: number
    r: number
    vy: number
    vx: number
    phase: number
    sway: number
    rot: number
    vr: number
    alpha: number
}

const makePetal = (w: number, h: number, scatter: boolean): Petal => ({
    x: Math.random() * w,
    y: scatter ? Math.random() * h : -10 - Math.random() * 40,
    r: 2 + Math.random() * 3.2,
    vy: 18 + Math.random() * 28, // пикселей в секунду
    vx: -6 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
    sway: 10 + Math.random() * 18,
    rot: Math.random() * Math.PI * 2,
    vr: -1 + Math.random() * 2,
    alpha: 0.35 + Math.random() * 0.5,
})

const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Падающие лепестки поверх страницы (под шапкой и плеером). Тихо отключаются, если в системе выключены анимации */
export const Sakura = () => {
    const enabled = useSakuraEnabled()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const active = enabled && !reducedMotion()

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!active || !canvas || !ctx) return

        const count = window.innerWidth < 640 ? 14 : 30
        let w = 0
        let h = 0
        let petals: Petal[] = []

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            w = window.innerWidth
            h = window.innerHeight
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            if (petals.length === 0) petals = Array.from({ length: count }, () => makePetal(w, h, true))
        }

        resize()
        window.addEventListener('resize', resize)

        let last = performance.now()
        let rafId = 0

        const frame = (now: number) => {
            rafId = requestAnimationFrame(frame)

            const dt = Math.min(0.05, (now - last) / 1000) // после возврата во вкладку не даём лепесткам «прыгнуть»
            last = now

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#ffb3d9'

            for (let i = 0; i < petals.length; i++) {
                const p = petals[i]!
                p.y += p.vy * dt
                p.phase += dt * 1.2
                p.x += (p.vx + Math.sin(p.phase) * p.sway) * dt
                p.rot += p.vr * dt

                if (p.y > h + 10 || p.x < -20 || p.x > w + 20) {
                    petals[i] = makePetal(w, h, false)
                    continue
                }

                ctx.save()
                ctx.translate(p.x, p.y)
                ctx.rotate(p.rot)
                ctx.globalAlpha = p.alpha
                ctx.beginPath()
                ctx.ellipse(0, 0, p.r * 1.25, p.r * 0.8, 0, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            }
        }

        rafId = requestAnimationFrame(frame)

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', resize)
        }
    }, [active])

    if (!active) return null

    return createPortal(
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 h-full w-full" />,
        document.body
    )
}

export const SakuraToggle = () => {
    const enabled = useSakuraEnabled()

    return (
        <button
            type="button"
            onClick={() => setSakura(!enabled)}
            aria-pressed={enabled}
            title={enabled ? 'Выключить лепестки' : 'Включить лепестки'}
            aria-label="Лепестки сакуры"
            className={`hidden md:grid place-items-center w-9 h-9 rounded-full cursor-pointer transition-colors ${
                enabled ? 'text-pink-300 bg-white/[0.07] hover:bg-white/[0.12]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.07]'
            }`}
        >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="6" r="3.2" />
                <circle cx="18" cy="10.4" r="3.2" />
                <circle cx="15.7" cy="17.4" r="3.2" />
                <circle cx="8.3" cy="17.4" r="3.2" />
                <circle cx="6" cy="10.4" r="3.2" />
                <circle cx="12" cy="12" r="2" fill="#0b0b0e" />
            </svg>
        </button>
    )
}