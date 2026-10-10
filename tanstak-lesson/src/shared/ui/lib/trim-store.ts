import { useSyncExternalStore } from 'react'

export type TrimRange = { trackId: string; start: number; end: number }

let current: TrimRange | null = null
const listeners = new Set<() => void>()

export const getTrim = () => current

export const setTrim = (next: TrimRange | null) => {
    const same =
        next === current ||
        (next !== null &&
            current !== null &&
            next.trackId === current.trackId &&
            next.start === current.start &&
            next.end === current.end)
    if (same) return

    current = next
    listeners.forEach((l) => l())
}

export const clearTrim = () => setTrim(null)

export const useTrim = (): TrimRange | null =>
    useSyncExternalStore(
        (cb) => {
            listeners.add(cb)
            return () => {
                listeners.delete(cb)
            }
        },
        () => current
    )