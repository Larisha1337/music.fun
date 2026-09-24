export type LyricLine = {
    time: number // Время в секундах
    text: string
}

export const parseLrc = (lrcText: string): LyricLine[] => {
    if (!lrcText) return []

    const lines = lrcText.split('\n')
    // Убрали лишнее экранирование для символа ']'
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})](.*)/

    const result: LyricLine[] = []

    for (const line of lines) {
        const match = line.match(regex)

        if (match) {
            // Деструктуризируем элементы
            const [, minStr, secStr, msStr, rawText] = match

            if (minStr && secStr && msStr && rawText !== undefined) {
                const minutes = parseInt(minStr, 10)
                const seconds = parseInt(secStr, 10)
                const milliseconds = parseInt(msStr.padEnd(3, '0'), 10)

                const totalTime = minutes * 60 + seconds + milliseconds / 1000
                const text = rawText.trim()

                if (text) {
                    result.push({ time: totalTime, text })
                }
            }
        }
    }

    return result.sort((a, b) => a.time - b.time)
}