import { useCallback, useEffect, useRef, useState } from 'react'

export type SleepMode = { kind: 'off' } | { kind: 'time'; endsAt: number } | { kind: 'track' }

type Options = {
    audioRef: React.RefObject<HTMLAudioElement | null>
    /** Громкость, которую нужно вернуть после затухания */
    getVolume: () => number
    /** Трек остановлен таймером */
    onFired: () => void
}

const FADE_MS = 3000
const FADE_STEPS = 30

export const useSleepTimer = ({ audioRef, getVolume, onFired }: Options) => {
    const [mode, setMode] = useState<SleepMode>({ kind: 'off' })
    const [remaining, setRemaining] = useState(0)

    const modeRef = useRef<SleepMode>(mode)
    const fadeRef = useRef<number | null>(null)
    const callbacksRef = useRef({ getVolume, onFired })

    useEffect(() => {
        modeRef.current = mode
    }, [mode])

    useEffect(() => {
        callbacksRef.current = { getVolume, onFired }
    })

    // Плавное затухание за 3 секунды, потом пауза и возврат громкости
    const fadeOutAndStop = useCallback(() => {
        const audio = audioRef.current
        if (!audio) {
            callbacksRef.current.onFired()
            return
        }

        const from = audio.volume
        let step = 0
        if (fadeRef.current) window.clearInterval(fadeRef.current)

        fadeRef.current = window.setInterval(() => {
            step += 1
            audio.volume = Math.max(0, from * (1 - step / FADE_STEPS))

            if (step >= FADE_STEPS) {
                if (fadeRef.current) window.clearInterval(fadeRef.current)
                fadeRef.current = null
                audio.pause()
                audio.volume = callbacksRef.current.getVolume()
                callbacksRef.current.onFired()
            }
        }, FADE_MS / FADE_STEPS)
    }, [audioRef])

    // Таймер «через N минут»
    useEffect(() => {
        if (mode.kind !== 'time') {
            setRemaining(0)
            return
        }

        const endsAt = mode.endsAt

        const tick = () => {
            const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
            setRemaining(left)

            if (left <= 0) {
                setMode({ kind: 'off' })
                fadeOutAndStop()
            }
        }

        tick()
        const id = window.setInterval(tick, 1000)
        return () => window.clearInterval(id)
    }, [mode, fadeOutAndStop])

    useEffect(
        () => () => {
            if (fadeRef.current) window.clearInterval(fadeRef.current)
        },
        []
    )

    /** Вызывается, когда трек доиграл: true, если стоял режим «до конца трека» и надо остановиться */
    const consumeEndOfTrack = useCallback(() => {
        if (modeRef.current.kind !== 'track') return false
        setMode({ kind: 'off' })
        return true
    }, [])

    return {
        mode,
        remaining,
        cancel: () => setMode({ kind: 'off' }),
        startMinutes: (minutes: number) => setMode({ kind: 'time', endsAt: Date.now() + minutes * 60_000 }),
        startEndOfTrack: () => setMode({ kind: 'track' }),
        consumeEndOfTrack,
    }
}