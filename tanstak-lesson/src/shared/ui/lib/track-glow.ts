import { useSyncExternalStore } from 'react'

type GlowState = {
    rgb: string | null   // например "129, 140, 248"
    playing: boolean
    /** true, когда визуализатор читает звук и свечение может биться в такт */
    reactive: boolean
}

let state: GlowState = { rgb: null, playing: false, reactive: false }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const setGlow = (patch: Partial<GlowState>) => {
    const next = { ...state, ...patch }
    if (next.rgb === state.rgb && next.playing === state.playing && next.reactive === state.reactive) return
    state = next
    emit()
}

export const resetGlow = () => {
    state = { rgb: null, playing: false, reactive: false }
    emit()
}

export const useGlow = (): GlowState =>
    useSyncExternalStore(
        (cb) => {
            listeners.add(cb)
            return () => listeners.delete(cb)
        },
        () => state
    )

/* ---------- Пульс звука (60 раз в секунду, мимо React) ---------- */

type BeatListener = (level: number) => void
const beatListeners = new Set<BeatListener>()

/** level от 0 до 1: сила удара в басах прямо сейчас */
export const publishBeat = (level: number) => {
    beatListeners.forEach((l) => l(level))
}

export const subscribeBeat = (listener: BeatListener) => {
    beatListeners.add(listener)
    return () => {
        beatListeners.delete(listener)
    }
}

/* ---------- Цвет: делаем ярче, чтобы даже тёмные обложки светились ---------- */

const parseColor = (input: string): [number, number, number] => {
    const rgb = input.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]

    const hex = input.replace('#', '')
    if (/^[0-9a-f]{6}$/i.test(hex)) {
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
        ]
    }
    return [249, 92, 158]
}

const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return [0, 0, l]

    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h = 0
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    return [h / 6, s, l]
}

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    if (s === 0) {
        const v = Math.round(l * 255)
        return [v, v, v]
    }
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    return [
        Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    ]
}

/** Берём цвет обложки, подтягиваем насыщенность и яркость до «неонового» уровня */
export const vividRgb = (input: string): [number, number, number] => {
    const [h, s, l] = rgbToHsl(parseColor(input))
    return hslToRgb(h, Math.max(s, 0.7), Math.min(Math.max(l, 0.55), 0.68))
}

/** Двухслойное свечение: плотное ядро и широкий ореол */
export const glowShadow = (rgb: string, level: 'low' | 'high') =>
    level === 'low'
        ? `0 0 12px 2px rgba(${rgb}, 0.55), 0 0 28px 6px rgba(${rgb}, 0.3)`
        : `0 0 20px 5px rgba(${rgb}, 0.85), 0 0 56px 16px rgba(${rgb}, 0.5)`