import { useSyncExternalStore } from 'react'

export type ComposeSegment = {
    id: string
    trackId: string
    title: string
    artist?: string
    coverUrl?: string | null
    start: number
    end: number
}

export const MAX_SEGMENTS = 20
export const MAX_TOTAL = 1800
export const CROSSFADES = [0, 0.5, 1, 2] as const

type State = { segments: ComposeSegment[]; crossfade: number; open: boolean }

const KEY = 'compose-draft'

const isSegment = (v: unknown): v is ComposeSegment => {
    if (!v || typeof v !== 'object') return false
    const s = v as Record<string, unknown>
    return (
        typeof s.id === 'string' &&
        typeof s.trackId === 'string' &&
        typeof s.title === 'string' &&
        typeof s.start === 'number' &&
        typeof s.end === 'number' &&
        s.end > s.start
    )
}

const load = (): Pick<State, 'segments' | 'crossfade'> => {
    try {
        const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
        if (raw && typeof raw === 'object') {
            const r = raw as { segments?: unknown; crossfade?: unknown }
            const segments = Array.isArray(r.segments) ? r.segments.filter(isSegment).slice(0, MAX_SEGMENTS) : []
            const crossfade = (CROSSFADES as readonly number[]).includes(Number(r.crossfade)) ? Number(r.crossfade) : 0
            return { segments, crossfade }
        }
    } catch {
        // повреждённый черновик: начинаем с пустого
    }
    return { segments: [], crossfade: 0 }
}

let state: State = { ...load(), open: false }
const listeners = new Set<() => void>()

const commit = (next: State) => {
    state = next
    try {
        localStorage.setItem(KEY, JSON.stringify({ segments: next.segments, crossfade: next.crossfade }))
    } catch {
        // хранилище недоступно: черновик живёт до перезагрузки
    }
    listeners.forEach((l) => l())
}

const makeId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)

/** false, если сборка уже заполнена */
export const addSegment = (seg: Omit<ComposeSegment, 'id'>): boolean => {
    if (state.segments.length >= MAX_SEGMENTS) return false
    commit({ ...state, segments: [...state.segments, { ...seg, id: makeId() }] })
    return true
}

export const removeSegment = (id: string) =>
    commit({ ...state, segments: state.segments.filter((s) => s.id !== id) })

export const moveSegment = (fromId: string, toId: string) => {
    const from = state.segments.findIndex((s) => s.id === fromId)
    const to = state.segments.findIndex((s) => s.id === toId)
    if (from < 0 || to < 0 || from === to) return

    const next = [...state.segments]
    const [item] = next.splice(from, 1)
    if (!item) return
    next.splice(to, 0, item)
    commit({ ...state, segments: next })
}

export const clearCompose = () => commit({ ...state, segments: [] })
export const setCrossfade = (crossfade: number) => commit({ ...state, crossfade })
export const openCompose = () => commit({ ...state, open: true })
export const closeCompose = () => commit({ ...state, open: false })

/** Те же формулы, что на сервере: переход не длиннее половины самого короткого отрезка */
export const effectiveFade = (segments: ComposeSegment[], crossfade: number) => {
    if (crossfade <= 0 || segments.length < 2) return 0
    const minLen = Math.min(...segments.map((s) => s.end - s.start))
    return Math.max(0.1, Math.min(crossfade, minLen / 2 - 0.05))
}

export const composeDuration = (segments: ComposeSegment[], crossfade: number) =>
    Math.max(
        0,
        segments.reduce((sum, s) => sum + (s.end - s.start), 0) -
        effectiveFade(segments, crossfade) * Math.max(0, segments.length - 1)
    )

export const useCompose = (): State =>
    useSyncExternalStore(
        (cb) => {
            listeners.add(cb)
            return () => {
                listeners.delete(cb)
            }
        },
        () => state
    )