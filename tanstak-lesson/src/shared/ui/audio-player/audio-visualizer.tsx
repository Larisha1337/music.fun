import { useEffect, useRef } from "react";

type Props = {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    isPlaying: boolean;
    color?: string;
};

export const AudioVisualizer = ({ audioRef, isPlaying, color = "#6366f1" }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // 1. Инициализация AudioContext и AnalyserNode
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // MediaElementAudioSourceNode создается ровно 1 раз для одного <audio> тега
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioContextClass();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64; // Разрешение спектра (32 частотные полосы)

            try {
                // Добавляем атрибут crossorigin для поддержки Web Audio API
                audio.crossOrigin = "anonymous";
                const source = ctx.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(ctx.destination);

                audioCtxRef.current = ctx;
                analyserRef.current = analyser;
            } catch (e) {
                console.warn("AudioContext init error (CORS or re-init):", e);
            }
        }

        // Браузеры блокируют незапрошенный звук: возобновляем контекст при play
        if (isPlaying && audioCtxRef.current?.state === "suspended") {
            audioCtxRef.current.resume();
        }
    }, [audioRef, isPlaying]);

    // 2. Анимационный цикл отрисовки на Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
            animationFrameRef.current = requestAnimationFrame(render);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barCount = 12;
            const gap = 2;
            const barWidth = (width - gap * (barCount - 1)) / barCount;

            // Если пауза или контекст не готов — рисуем минимальные точки
            if (!analyserRef.current || !isPlaying) {
                ctx.fillStyle = `${color}50`;
                for (let i = 0; i < barCount; i++) {
                    ctx.beginPath();
                    ctx.roundRect(i * (barWidth + gap), height - 3, barWidth, 3, 1);
                    ctx.fill();
                }
                return;
            }

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            for (let i = 0; i < barCount; i++) {
                // Извлекаем значение частоты для столбика
                const value = dataArray[i * 2] || 0;
                const percent = value / 255;
                const barHeight = Math.max(3, percent * height);

                ctx.fillStyle = color;
                ctx.beginPath();
                // Закруглённые сверху столбики
                ctx.roundRect(
                    i * (barWidth + gap),
                    height - barHeight,
                    barWidth,
                    barHeight,
                    [2, 2, 0, 0]
                );
                ctx.fill();
            }
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, color]);

    return (
        <canvas
            ref={canvasRef}
            width={64}
            height={24}
            className="shrink-0 transition-opacity duration-300"
            title="Audio Spectrum Visualizer"
        />
    );
};