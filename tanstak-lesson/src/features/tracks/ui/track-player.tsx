import { useEffect, useRef, useState } from 'react'

type Props = {
    src: string
    onEnded: () => void
}

const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

export const TrackPlayer = ({ src, onEnded }: Props) => {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(true)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        audio.play().catch(() => {})

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => {
            setIsPlaying(false)
            onEnded()
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [src])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return
        if (isPlaying) {
            audio.pause()
        } else {
            audio.play().catch(() => {})
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current
        if (!audio) return
        const newTime = Number(e.target.value)
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="w-full flex items-center gap-3 bg-[#18181b] rounded-lg px-3 py-2">
            <audio ref={audioRef} src={src} className="hidden" />

            <button
                type="button"
                onClick={togglePlay}
                className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
                {isPlaying ? <span className="text-[10px]">❚❚</span> : <span className="text-[10px] translate-x-[1px]">▶</span>}
            </button>

            <span className="text-[11px] text-zinc-400 tabular-nums shrink-0 w-9">
        {formatTime(currentTime)}
      </span>

            <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #6366f1 ${progress}%, #3f3f46 ${progress}%)`
                }}
            />

            <span className="text-[11px] text-zinc-400 tabular-nums shrink-0 w-9">
        {formatTime(duration)}
      </span>
        </div>
    )
}