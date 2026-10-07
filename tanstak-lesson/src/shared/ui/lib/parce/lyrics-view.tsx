import { useCallback, useEffect, useRef, memo } from 'react'
import { type LyricLine } from '@/shared/ui/lib/parce/lrc-parser'

interface LyricsViewProps {
    lyrics: LyricLine[]
    currentTime: number
    offset?: number
    onLineClick?: (time: number) => void
}

// Бинарный поиск вместо перебора всех строк на каждом обновлении времени
const findActiveIndex = (lyrics: LyricLine[], time: number) => {
    let lo = 0
    let hi = lyrics.length - 1
    let found = -1

    while (lo <= hi) {
        const mid = (lo + hi) >> 1
        const line = lyrics[mid]
        if (line && line.time <= time) {
            found = mid
            lo = mid + 1
        } else {
            hi = mid - 1
        }
    }
    return found
}

const opacityFor = (distance: number) =>
    distance === 0 ? 1 : distance === 1 ? 0.6 : distance === 2 ? 0.42 : 0.25

const blurFor = (distance: number) => (distance === 0 ? 0 : Math.min(distance, 3) * 0.6)

const MASK = 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'

export const LyricsView = memo(({ lyrics, currentTime, offset = 0.3, onLineClick }: LyricsViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const lineRefs = useRef<(HTMLParagraphElement | null)[]>([])
    const manualUntilRef = useRef(0)
    const resumeTimerRef = useRef<number | null>(null)
    const isFirstScrollRef = useRef(true)

    // Прибавляем offset, чтобы текст подсвечивался чуть раньше
    const activeIndex = findActiveIndex(lyrics, currentTime + offset)

    const activeIndexRef = useRef(activeIndex)
    useEffect(() => {
        activeIndexRef.current = activeIndex
    }, [activeIndex])

    // Прокручиваем только сам список, а не всю страницу (scrollIntoView мог дёргать и страницу)
    const scrollToLine = useCallback((index: number, behavior: ScrollBehavior) => {
        const container = containerRef.current
        const line = lineRefs.current[index]
        if (!container || !line) return

        const top = line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2
        container.scrollTo({ top, behavior })
    }, [])

    // Новый трек: начинаем сверху
    useEffect(() => {
        isFirstScrollRef.current = true
        containerRef.current?.scrollTo({ top: 0 })
    }, [lyrics])

    // Следим за активной строкой (если пользователь не листает текст сам)
    useEffect(() => {
        if (activeIndex < 0) return
        if (Date.now() < manualUntilRef.current) return

        scrollToLine(activeIndex, isFirstScrollRef.current ? 'auto' : 'smooth')
        isFirstScrollRef.current = false
    }, [activeIndex, scrollToLine])

    // Пользователь листает сам: на 3,5 секунды отключаем автоскролл, потом возвращаемся к активной строке
    const pauseAutoScroll = useCallback(() => {
        manualUntilRef.current = Date.now() + 3500
        if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)

        resumeTimerRef.current = window.setTimeout(() => {
            if (activeIndexRef.current >= 0) scrollToLine(activeIndexRef.current, 'smooth')
        }, 3600)
    }, [scrollToLine])

    useEffect(() => {
        return () => {
            if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
        }
    }, [])

    const handleLineClick = (time: number) => {
        if (!onLineClick) return
        manualUntilRef.current = 0 // после перемотки сразу следуем за текстом
        onLineClick(time)
    }

    if (!lyrics.length) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 py-20 text-xl font-medium">
                Текст песни отсутствует или не синхронизирован
            </div>
        )
    }

    const clickable = Boolean(onLineClick)

    return (
        <div
            ref={containerRef}
            onWheel={pauseAutoScroll}
            onTouchMove={pauseAutoScroll}
            className="relative h-full w-full overflow-y-auto overscroll-contain flex flex-col items-center gap-5 sm:gap-7 select-none [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', maskImage: MASK, WebkitMaskImage: MASK }}
        >
            <div className="shrink-0" style={{ height: '45%' }} aria-hidden="true" />

            {lyrics.map((line, index) => {
                const distance = Math.abs(index - activeIndex)
                const isActive = index === activeIndex
                const blur = blurFor(distance)

                return (
                    <p
                        key={`${line.time}-${index}`}
                        ref={(el) => {
                            lineRefs.current[index] = el
                        }}
                        onClick={() => handleLineClick(line.time)}
                        onKeyDown={(e) => {
                            if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault()
                                handleLineClick(line.time)
                            }
                        }}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        title={clickable ? 'Перемотать сюда' : undefined}
                        style={{
                            opacity: opacityFor(distance),
                            filter: blur ? `blur(${blur}px)` : undefined,
                        }}
                        className={`shrink-0 text-center font-extrabold leading-snug px-4 sm:px-6 max-w-3xl origin-center transition-all duration-500 ease-out text-xl sm:text-2xl lg:text-3xl ${
                            clickable ? 'cursor-pointer [@media(hover:hover)]:hover:text-white' : ''
                        } ${
                            isActive
                                ? 'text-white scale-105 drop-shadow-[0_0_18px_rgba(255,255,255,0.55)]'
                                : 'text-white/80 scale-95'
                        }`}
                    >
                        {line.text}
                    </p>
                )
            })}

            <div className="shrink-0" style={{ height: '45%' }} aria-hidden="true" />
        </div>
    )
})

LyricsView.displayName = 'LyricsView'