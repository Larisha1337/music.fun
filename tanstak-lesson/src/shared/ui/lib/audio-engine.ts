import { useSyncExternalStore } from 'react'

export type AudioGraph = {
    ctx: AudioContext
    analyser: AnalyserNode
    filters: BiquadFilterNode[]
}

export const EQ_LIMIT = 12 // децибел в обе стороны

export const EQ_BANDS: { freq: number; type: BiquadFilterType; label: string }[] = [
    { freq: 60, type: 'lowshelf', label: '60 Гц' },
    { freq: 230, type: 'peaking', label: '230 Гц' },
    { freq: 910, type: 'peaking', label: '910 Гц' },
    { freq: 3600, type: 'peaking', label: '3,6 кГц' },
    { freq: 14000, type: 'highshelf', label: '14 кГц' },
]

export const EQ_PRESETS: { id: string; label: string; gains: number[] }[] = [
    { id: 'flat', label: 'Плоский', gains: [0, 0, 0, 0, 0] },
    { id: 'bass', label: 'Бас', gains: [6, 4, 0, -1, -1] },
    { id: 'vocal', label: 'Вокал', gains: [-3, -1, 2, 3, 1] },
    { id: 'bright', label: 'Яркий', gains: [-1, 0, 0, 3, 6] },
]

const STORAGE_KEY = 'player-eq'

const loadEq = (): number[] => {
    try {
        const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
        if (
            Array.isArray(raw) &&
            raw.length === EQ_BANDS.length &&
            raw.every((v) => typeof v === 'number' && Math.abs(v) <= EQ_LIMIT)
        ) {
            return raw as number[]
        }
    } catch {
        // повреждённое значение: начинаем с плоской кривой
    }
    return EQ_BANDS.map(() => 0)
}

let eq = loadEq()
const listeners = new Set<() => void>()

type Entry = { audio: HTMLMediaElement; graph: AudioGraph }
const graphs = new WeakMap<HTMLMediaElement, AudioGraph>()
const entries = new Set<Entry>()

/** Закрываем контексты у элементов, которых уже нет на странице (например, после закрытия PiP) */
const prune = () => {
    for (const entry of entries) {
        if (!entry.audio.isConnected) {
            entries.delete(entry)
            graphs.delete(entry.audio)
            entry.graph.ctx.close().catch(() => {})
        }
    }
}

const applyToGraph = (graph: AudioGraph) => {
    graph.filters.forEach((filter, i) => {
        filter.gain.setTargetAtTime(eq[i] ?? 0, graph.ctx.currentTime, 0.02)
    })
}

/** Один <audio> можно подключить к Web Audio только один раз, поэтому граф хранится здесь */
export const getAudioGraph = (audio: HTMLMediaElement): AudioGraph | null => {
    const existing = graphs.get(audio)
    if (existing) return existing

    prune()

    let ctx: AudioContext | null = null
    try {
        const Ctor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new Ctor()
        ctx = audioCtx

        const source = audioCtx.createMediaElementSource(audio)

        const filters = EQ_BANDS.map((band, i) => {
            const filter = audioCtx.createBiquadFilter()
            filter.type = band.type
            filter.frequency.value = band.freq
            if (band.type === 'peaking') filter.Q.value = 1
            filter.gain.value = eq[i] ?? 0
            return filter
        })

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256 // 128 полос
        analyser.smoothingTimeConstant = 0.7

        let node: AudioNode = source
        for (const filter of filters) {
            node.connect(filter)
            node = filter
        }
        node.connect(analyser)
        analyser.connect(audioCtx.destination)

        const graph: AudioGraph = { ctx: audioCtx, analyser, filters }
        graphs.set(audio, graph)
        entries.add({ audio, graph })
        return graph
    } catch (e) {
        console.warn('[AudioEngine] Ошибка инициализации AudioContext:', e)
        ctx?.close().catch(() => {})
        return null
    }
}

/* ---------- Эквалайзер ---------- */

const commit = (next: number[]) => {
    eq = next
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
        // хранилище недоступно: настройка действует до перезагрузки
    }
    for (const entry of entries) applyToGraph(entry.graph)
    listeners.forEach((l) => l())
}

export const setEqBand = (index: number, gain: number) => {
    const value = Math.max(-EQ_LIMIT, Math.min(EQ_LIMIT, Math.round(gain)))
    if (eq[index] === value) return
    const next = [...eq]
    next[index] = value
    commit(next)
}

export const setEqPreset = (gains: readonly number[]) => commit([...gains])

export const useEq = (): number[] =>
    useSyncExternalStore(
        (cb) => {
            listeners.add(cb)
            return () => listeners.delete(cb)
        },
        () => eq
    )