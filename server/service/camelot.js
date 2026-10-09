// Круг Камелот: так диджеи подбирают треки, которые звучат вместе
const CAMELOT = {
    C: '8B', G: '9B', D: '10B', A: '11B', E: '12B', B: '1B',
    'F#': '2B', 'C#': '3B', 'G#': '4B', 'D#': '5B', 'A#': '6B', F: '7B',
    Am: '8A', Em: '9A', Bm: '10A', 'F#m': '11A', 'C#m': '12A', 'G#m': '1A',
    'D#m': '2A', 'A#m': '3A', Fm: '4A', Cm: '5A', Gm: '6A', Dm: '7A',
}

// Тональности в порядке круга Камелот: 1A, 1B, 2A, 2B ...
export const KEYS_BY_CAMELOT = Object.keys(CAMELOT).sort((a, b) => {
    const rank = (k) => parseInt(CAMELOT[k], 10) * 2 + (CAMELOT[k].endsWith('B') ? 1 : 0)
    return rank(a) - rank(b)
})

export const toCamelot = (key) => (key ? CAMELOT[key] ?? null : null)

const split = (code) => ({ n: parseInt(code, 10), letter: code.slice(-1) })

/** 'same' | 'compatible' | null */
export const keyRelation = (a, b) => {
    const ca = toCamelot(a)
    const cb = toCamelot(b)
    if (!ca || !cb) return null
    if (ca === cb) return 'same'

    const x = split(ca)
    const y = split(cb)
    if (x.n === y.n) return 'compatible' // параллельные мажор/минор
    if (x.letter === y.letter) {
        const d = Math.abs(x.n - y.n)
        if (d === 1 || d === 11) return 'compatible' // соседи по кругу
    }
    return null
}

export const keyScore = (relation) => (relation === 'same' ? 1 : relation === 'compatible' ? 0.7 : 0)

/** Разница в темпе. Детекторы часто путают темп вдвое, поэтому x2 и /2 тоже считаются (с небольшим штрафом) */
export const bpmDistance = (a, b) => {
    if (!a || !b) return null
    return Math.min(Math.abs(a - b), Math.abs(a - b * 2) + 4, Math.abs(a * 2 - b) + 4)
}