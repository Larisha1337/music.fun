import { useEffect, useRef } from "react";
import { publishBeat, setGlow } from "@/shared/ui/lib/track-glow.ts";

type Props = {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    isPlaying: boolean;
    color?: string;
};

type AudioGraph = { ctx: AudioContext; analyser: AnalyserNode };

// Один <audio> можно подключить к Web Audio только один раз,
// поэтому граф хранится здесь и переживает перемонтирование компонента (например, при переходе в PiP)
const graphs = new WeakMap<HTMLMediaElement, AudioGraph>();

const getGraph = (audio: HTMLMediaElement): AudioGraph | null => {
    const existing = graphs.get(audio);
    if (existing) return existing;

    let ctx: AudioContext | null = null;
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AudioContextClass();

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256; // 128 полос, примерно по 172 Гц
        analyser.smoothingTimeConstant = 0.7;

        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        const graph = { ctx, analyser };
        graphs.set(audio, graph);
        return graph;
    } catch (e) {
        console.warn("[AudioVisualizer] Ошибка инициализации AudioContext:", e);
        ctx?.close().catch(() => {});
        return null;
    }
};

const W = 64;
const H = 24;
const BARS = 12;

// Границы полос по логарифмической шкале: низкие частоты занимают столько же места, сколько высокие
const EDGES = Array.from({ length: BARS + 1 }, (_, i) =>
    Math.max(1, Math.round(Math.pow(64, i / BARS)))
);

export const AudioVisualizer = ({ audioRef, isPlaying, color = "#6366f1" }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const graphRef = useRef<AudioGraph | null>(null);
    const levelRef = useRef(0); // сглаженный уровень удара
    const avgRef = useRef(0);   // скользящее среднее баса

    // 1. Подключаем анализатор к <audio>
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        graphRef.current = getGraph(audio);
    }, [audioRef]);

    // 2. Возобновляем AudioContext при воспроизведении
    useEffect(() => {
        const ctx = graphRef.current?.ctx;
        if (isPlaying && ctx?.state === "suspended") {
            ctx.resume().catch((err) => {
                console.warn("[AudioVisualizer] Не удалось возобновить AudioContext:", err);
            });
        }
    }, [isPlaying]);

    // 3. Сообщаем остальному интерфейсу, что свечение может биться в такт
    useEffect(() => {
        if (!isPlaying || !graphRef.current) return;
        setGlow({ reactive: true });
        return () => setGlow({ reactive: false });
    }, [isPlaying]);

    // 4. Анимационный цикл
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;

        const graph = graphRef.current;
        const analyser = graph?.analyser ?? null;
        const data = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

        const drawBar = (x: number, y: number, w: number, h: number) => {
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, [2, 2, 0, 0]);
            else ctx.rect(x, y, w, h);
            ctx.fill();
        };

        let rafId = 0;

        const render = () => {
            rafId = requestAnimationFrame(render);

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);

            const gap = 2;
            const barWidth = (W - gap * (BARS - 1)) / BARS;
            const live = Boolean(analyser && isPlaying && graph?.ctx.state === "running");

            // Пауза: низкие плашки, пульс плавно затухает
            if (!live || !analyser) {
                if (levelRef.current > 0.005) {
                    levelRef.current *= 0.88;
                    publishBeat(levelRef.current);
                } else if (levelRef.current !== 0) {
                    levelRef.current = 0;
                    publishBeat(0);
                }

                ctx.fillStyle = color;
                ctx.globalAlpha = 0.35;
                for (let i = 0; i < BARS; i++) {
                    drawBar(i * (barWidth + gap), H - 3, barWidth, 3);
                }
                ctx.globalAlpha = 1;
                return;
            }

            analyser.getByteFrequencyData(data);

            // Спектр
            ctx.fillStyle = color;
            for (let i = 0; i < BARS; i++) {
                const from = EDGES[i] ?? 1;
                const to = Math.max(EDGES[i + 1] ?? from + 1, from + 1);

                let sum = 0;
                for (let b = from; b < to; b++) sum += data[b] ?? 0;

                // Высокие частоты в музыке тише, слегка подтягиваем их
                const value = (sum / (to - from)) * (1 + i * 0.05);
                const barHeight = Math.max(3, Math.min(1, value / 255) * H);
                drawBar(i * (barWidth + gap), H - barHeight, barWidth, barHeight);
            }

            // Пульс: сила баса относительно его недавнего среднего (так ловятся именно удары)
            const bass = ((data[0] ?? 0) + (data[1] ?? 0) + (data[2] ?? 0)) / (3 * 255);
            avgRef.current = avgRef.current * 0.97 + bass * 0.03;
            const punch = Math.max(0, bass - avgRef.current) * 3.5;
            const target = Math.min(1, punch + bass * 0.3);
            levelRef.current = Math.max(target, levelRef.current * 0.86);
            publishBeat(levelRef.current);
        };

        render();

        return () => cancelAnimationFrame(rafId);
    }, [isPlaying, color]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: W, height: H }}
            className="shrink-0 transition-opacity duration-300"
            title="Audio Spectrum Visualizer"
        />
    );
};