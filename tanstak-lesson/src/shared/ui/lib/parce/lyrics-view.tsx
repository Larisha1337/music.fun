import { useEffect, useRef, useState } from 'react'
import { parseLrc, type LyricLine } from '@/shared/ui/lib/parce/lrc-parser'

interface LyricsViewProps {
    lrcString: string
    currentTime: number
    // Изменили дефолтный offset на 0.3.
    // Это заставит текст "спешить" на 300мс, компенсируя системную задержку плеера.
    offset?: number
    onLineClick?: (time: number) => void
}

export const LyricsView = ({ lrcString, currentTime, offset = 0.3, onLineClick }: LyricsViewProps) => {
    const [lyrics, setLyrics] = useState<LyricLine[]>([])
    const activeLineRef = useRef<HTMLParagraphElement | null>(null)

    useEffect(() => {
        if (lrcString) {
            setLyrics(parseLrc(lrcString))
        }
    }, [lrcString])

    // Прибавляем offset, чтобы текст подсвечивался чуть раньше
    const adjustedTime = currentTime + offset

    const activeIndex = lyrics.findIndex((line, index) => {
        const nextLine = lyrics[index + 1]
        return adjustedTime >= line.time && (!nextLine || adjustedTime < nextLine.time)
    })

    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }, [activeIndex])

    if (!lyrics.length) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 py-20 text-xl font-medium">
                Текст песни отсутствует или не синхронизирован
            </div>
        )
    }

    return (
        <div
            className="w-full h-[65vh] overflow-y-auto scrollbar-none flex flex-col items-center py-[30vh] space-y-8 select-none"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
            }}
        >
            {lyrics.map((line, index) => {
                const isActive = index === activeIndex

                return (
                    <p
                        key={`${line.time}-${index}`}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => onLineClick?.(line.time)}
                        // 1. Базовый размер теперь один: text-2xl sm:text-3xl (чуть больше, чем было)
                        // 2. Анимация увеличена до duration-700 и добавлен ease-in-out для "нежности"
                        // 3. Используем transform (scale) вместо смены размера шрифта, чтобы не было "прыжков"
                        className={`text-center font-black transition-all duration-700 ease-in-out cursor-pointer max-w-3xl px-6 origin-center text-2xl sm:text-3xl ${
                            isActive
                                ? 'text-white scale-105 opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.7)] blur-0'
                                : 'text-white/40 hover:text-white/70 scale-95 opacity-40 blur-[1px]'
                        }`}
                    >
                        {line.text}
                    </p>
                )
            })}
        </div>
    )
}