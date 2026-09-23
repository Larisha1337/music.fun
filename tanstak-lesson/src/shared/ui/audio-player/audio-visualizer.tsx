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
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // 1. Инициализация Web Audio API
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Включаем CORS-режим на уровне элемента
        if (audio.crossOrigin !== "anonymous") {
            audio.crossOrigin = "anonymous";
        }

        // Подключаем AnalyserNode к <audio>
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioContextClass();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64; // 32 частотные полосы

            try {
                // MediaElementSource можно создать только один раз для одного элемента <audio>
                if (!sourceRef.current) {
                    const source = ctx.createMediaElementSource(audio);
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    sourceRef.current = source;
                }

                audioCtxRef.current = ctx;
                analyserRef.current = analyser;
            } catch (e) {
                console.warn("[AudioVisualizer] Ошибка инициализации AudioContext:", e);
            }
        }
    }, [audioRef]);

    // 2. Возобновление AudioContext при воспроизведении
    useEffect(() => {
        if (isPlaying && audioCtxRef.current?.state === "suspended") {
            audioCtxRef.current.resume().catch((err) => {
                console.warn("[AudioVisualizer] Не удалось возобновить AudioContext:", err);
            });
        }
    }, [isPlaying]);

    // 3. Анимационный цикл Canvas
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

            // Если пауза или контекст не готов — рисуем минимальные плашки
            if (!analyserRef.current || !isPlaying || audioCtxRef.current?.state === "suspended") {
                ctx.fillStyle = `${color}50`;
                for (let i = 0; i < barCount; i++) {
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(i * (barWidth + gap), height - 3, barWidth, 3, 1);
                    } else {
                        ctx.rect(i * (barWidth + gap), height - 3, barWidth, 3);
                    }
                    ctx.fill();
                }
                return;
            }

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            for (let i = 0; i < barCount; i++) {
                // Пропускаем самые низкие/высокие частоты для более красивого спектра
                const value = dataArray[i + 1] || 0;
                const percent = value / 255;
                const barHeight = Math.max(3, percent * height);

                ctx.fillStyle = color;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(
                        i * (barWidth + gap),
                        height - barHeight,
                        barWidth,
                        barHeight,
                        [2, 2, 0, 0]
                    );
                } else {
                    ctx.rect(i * (barWidth + gap), height - barHeight, barWidth, barHeight);
                }
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