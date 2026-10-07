export type LyricLine = {
    time: number // Время в секундах
    text: string
}

// Метка времени в начале строки: [mm:ss], [mm:ss.xx], [mm:ss.xxx] (иногда вместо точки двоеточие)
const TIME_TAG = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?]/y
// Сдвиг всего текста: [offset:+500] (в миллисекундах)
const OFFSET_TAG = /^\[offset:\s*([+-]?\d+)\s*]/i
// Пословные метки расширенного LRC: <00:12.34>
const WORD_TAG = /<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>/g

export const parseLrc = (lrcText: string): LyricLine[] => {
    if (!lrcText) return []

    let offsetSec = 0
    const result: LyricLine[] = []

    for (const rawLine of lrcText.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line) continue

        const offsetMatch = OFFSET_TAG.exec(line)
        if (offsetMatch?.[1]) {
            offsetSec = parseInt(offsetMatch[1], 10) / 1000
            continue
        }

        // У одной строки может быть несколько меток: [00:12.00][00:45.00]Припев
        const times: number[] = []
        let pos = 0

        for (;;) {
            TIME_TAG.lastIndex = pos
            const match = TIME_TAG.exec(line)
            if (!match) break

            const minutes = parseInt(match[1] ?? '0', 10)
            const seconds = parseInt(match[2] ?? '0', 10)
            const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0

            times.push(minutes * 60 + seconds + ms / 1000)
            pos = TIME_TAG.lastIndex
        }

        // Служебные теги ([ar:...], [ti:...]) меток времени не имеют и пропускаются
        if (times.length === 0) continue

        const text = line.slice(pos).replace(WORD_TAG, '').trim()
        if (!text) continue

        for (const t of times) {
            result.push({ time: Math.max(0, t - offsetSec), text })
        }
    }

    return result.sort((a, b) => a.time - b.time)
}