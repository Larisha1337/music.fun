import { useEffect, useRef, memo } from 'react'
import { type LyricLine } from '@/shared/ui/lib/parce/lrc-parser'

interface LyricsViewProps {
    lyrics: LyricLine[]
    currentTime: number
    offset?: number
    onLineClick?: (time: number) => void
}

export const LyricsView = memo(({ lyrics, currentTime, offset = 0.3, onLineClick }: LyricsViewProps) => {
    const activeLineRef = useRef<HTMLParagraphElement | null>(null)

    // Прибавляем offset, чтобы текст подсвечивался чуть раньше
    const adjustedTime = currentTime + offset

    // Находим активный индекс прямо во время рендеринга
    const activeIndex = lyrics.findIndex((line, index) => {
        const nextLine = lyrics[index + 1]
        return adjustedTime >= line.time && (!nextLine || adjustedTime < nextLine.time)
    })

    // Скроллим только тогда, когда реально меняется активная строка
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
});

LyricsView.displayName = 'LyricsView';