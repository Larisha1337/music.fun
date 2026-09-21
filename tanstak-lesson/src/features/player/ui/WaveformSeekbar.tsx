import React, { useRef, type MouseEvent } from 'react';

interface WaveformSeekbarProps {
    peaks: number[]; // Массив нормированных значений от 0.0 до 1.0 (например, 100 элементов)
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    barWidth?: number;
    barGap?: number;
    activeColor?: string;
    inactiveColor?: string;
}

export const WaveformSeekbar: React.FC<WaveformSeekbarProps> = ({
                                                                    peaks,
                                                                    currentTime,
                                                                    duration,
                                                                    onSeek,
                                                                    barWidth = 3,
                                                                    barGap = 2,
                                                                    activeColor = '#6366f1', // Indigo-500
                                                                    inactiveColor = '#3f3f46', // Zinc-700
                                                                }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const progressPercent = duration > 0 ? currentTime / duration : 0;

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || duration === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));

        onSeek(clickRatio * duration);
    };

    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            style={{ gap: `${barGap}px` }}
            className="relative w-full h-12 flex items-center cursor-pointer group py-2"
        >
            {peaks.map((peak, index) => {
                const barProgress = index / peaks.length;
                const isActive = barProgress <= progressPercent;

                return (
                    <div
                        key={index}
                        className="flex-1 rounded-full transition-all duration-150 group-hover:opacity-90"
                        style={{
                            height: `${Math.max(15, peak * 100)}%`,
                            backgroundColor: isActive ? activeColor : inactiveColor,
                            minWidth: `${barWidth}px`,
                        }}
                    />
                );
            })}
        </div>
    );
};