// Круг Камелот: ключи в нотации, которую возвращает Python-анализатор
const CAMELOT: Record<string, string> = {
    C: '8B', G: '9B', D: '10B', A: '11B', E: '12B', B: '1B',
    'F#': '2B', 'C#': '3B', 'G#': '4B', 'D#': '5B', 'A#': '6B', F: '7B',
    Am: '8A', Em: '9A', Bm: '10A', 'F#m': '11A', 'C#m': '12A', 'G#m': '1A',
    'D#m': '2A', 'A#m': '3A', Fm: '4A', Cm: '5A', Gm: '6A', Dm: '7A',
}

export const toCamelot = (key?: string | null): string | null => (key ? CAMELOT[key] ?? null : null)

/** Цвет по номеру на круге Камелот: соседние тональности получают соседние оттенки */
export const camelotColor = (code: string): string => {
    const n = parseInt(code, 10)
    return `hsl(${((n - 1) * 30 + 210) % 360} 75% 68%)`
}

export const camelotSortValue = (key?: string | null): number => {
    const code = toCamelot(key)
    if (!code) return Number.MAX_SAFE_INTEGER
    return parseInt(code, 10) * 2 + (code.endsWith('B') ? 1 : 0)
}