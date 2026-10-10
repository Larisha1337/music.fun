import { useEffect, useRef, type RefObject } from 'react'
import { subscribeBeat, useGlow } from '@/shared/ui/lib/track-glow.ts'

const COUNT = 5
const MAX_FALLING = 5

// Лепесток сакуры: острие с характерной выемкой
const PETAL_PATH = 'M0 0 C-9 -6 -11 -20 -5 -26 C-3 -28 -1 -27 0 -24 C1 -27 3 -28 5 -26 C11 -20 9 -6 0 0 Z'
const PETAL_SVG = `<svg viewBox="-11 -28 22 28" width="100%" height="100%" preserveAspectRatio="xMidYMax meet"><path d="${PETAL_PATH}" fill="#ffb7d9"/></svg>`

const reduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Цветок вокруг аватара. Сам ничего не считает: степень раскрытия и поворот
 * приходят из CSS-переменных --bloom и --rot (их выставляет useBloom на родителе)
 */
export const BloomPetals = () => (
    <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ filter: 'drop-shadow(0 0 5px rgba(249, 92, 158, 0.45))' }}
    >
        {Array.from({ length: COUNT }, (_, i) => (
            <span
                key={i}
                className="absolute left-1/2 top-1/2 block"
                style={{
                    width: '46%',
                    height: '74%',
                    marginLeft: '-23%',
                    marginTop: '-74%',
                    transformOrigin: '50% 100%',
                    transform: `rotate(calc(var(--rot, 0deg) + ${i * (360 / COUNT)}deg)) scale(calc(0.72 + var(--bloom, 0.22) * 0.38))`,
                    opacity: 'calc(0.5 + var(--bloom, 0.22) * 0.45)',
                }}
            >
                <svg viewBox="-11 -28 22 28" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
                    <path d={PETAL_PATH} fill="#ffb7d9" />
                </svg>
            </span>
        ))}
    </span>
)

/**
 * Раскрывает цветок под музыку. rootRef: элемент, на котором лежат переменные --bloom/--rot
 * (родитель и аватара, и плашки). layerRef: слой, в который падают оторвавшиеся лепестки
 */
export const useBloom = (rootRef: RefObject<HTMLElement | null>, layerRef: RefObject<HTMLElement | null>) => {
    const glow = useGlow()
    const playingRef = useRef(false)
    const reactiveRef = useRef(false)
    const levelRef = useRef(0)

    useEffect(() => {
        playingRef.current = glow.playing
        reactiveRef.current = glow.reactive
    }, [glow.playing, glow.reactive])

    useEffect(() => {
        return subscribeBeat((level) => {
            levelRef.current = level
        })
    }, [])

    useEffect(() => {
        const root = rootRef.current
        if (!root) return

        if (reduced()) {
            root.style.setProperty('--bloom', '0.5')
            return
        }

        let bloom = 0.22
        let rot = 0
        let last = performance.now()
        let lastSpawn = 0
        let alive = 0
        let raf = 0

        const spawn = () => {
            const layer = layerRef.current
            if (!layer || alive >= MAX_FALLING) return

            const el = document.createElement('span')
            el.setAttribute('aria-hidden', 'true')
            el.style.cssText =
                'position:absolute;left:50%;top:50%;width:11px;height:14px;margin:-7px 0 0 -5.5px;pointer-events:none;'
            el.innerHTML = PETAL_SVG
            layer.appendChild(el)
            alive++

            const side = Math.random() < 0.5 ? -1 : 1
            const dx = side * (12 + Math.random() * 26)
            const dy = 34 + Math.random() * 34
            const spin = side * (120 + Math.random() * 200)

            const anim = el.animate(
                [
                    { transform: 'translate(0, 0) rotate(0deg) scale(0.8)', opacity: 0.95 },
                    { transform: `translate(${dx * 0.4}px, ${dy * 0.35}px) rotate(${spin * 0.4}deg) scale(1)`, opacity: 0.9, offset: 0.35 },
                    { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(0.7)`, opacity: 0 },
                ],
                { duration: 2200 + Math.random() * 1200, easing: 'cubic-bezier(0.3, 0.6, 0.5, 1)' }
            )
            const done = () => {
                el.remove()
                alive--
            }
            anim.onfinish = done
            anim.oncancel = done
        }

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)

            const dt = Math.min(0.05, (now - last) / 1000)
            last = now

            const playing = playingRef.current
            const reactive = reactiveRef.current
            const level = playing && reactive ? levelRef.current : 0
            const breathe = playing && !reactive ? 0.14 * Math.sin(now / 450) : 0

            const target = playing ? 0.5 + level * 0.5 + breathe : 0.22
            bloom += (target - bloom) * Math.min(1, dt * 9)
            rot += dt * (playing ? 6 + level * 45 : 2.5)

            root.style.setProperty('--bloom', bloom.toFixed(3))
            root.style.setProperty('--rot', `${(rot % 360).toFixed(1)}deg`)

            if (playing) {
                const strongBeat = reactive && level > 0.6 && now - lastSpawn > 700
                const slowDrift = !reactive && now - lastSpawn > 2600
                if (strongBeat || slowDrift) {
                    lastSpawn = now
                    spawn()
                }
            }
        }

        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [rootRef, layerRef])
}