import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEqualizer, EQ_PRESETS, type PresetName, FREQUENCIES } from '../../equalizer/model/useEqualizer';
import { CrossfadeEngine } from '../../audio-engine/model/CrossfadeEngine';
import { WaveformSeekbar } from './WaveformSeekbar';
import { extractPeaks } from '@/shared/ui/lib/audio/extractPeaks';

interface Track {
    id: string;
    title: string;
    artist: string;
    url: string;
}

const DEMO_PLAYLIST: Track[] = [
    {
        id: '1',
        title: 'Wikimedia OGG Track',
        artist: 'Wikipedia Community',
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
    },
    {
        id: '2',
        title: 'Test Audio File',
        artist: 'Wikimedia Commons',
        url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Test_ogg_mp3_48khz_128kbps.ogg',
    },
];

export const AudioPlayer: React.FC = () => {
    // 1. Состояние воспроизведения
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [peaks, setPeaks] = useState<number[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    // @ts-ignore
    const [duration, setDuration] = useState(0);
    const [isLoadingPeaks, setIsLoadingPeaks] = useState(false);

    // 2. Ссылки на движок и Web Audio nodes
    const engineRef = useRef<CrossfadeEngine | null>(null);
    const currentTrack = DEMO_PLAYLIST[currentTrackIndex];

    // 3. Подключаем хук эквалайзера
    const { createEqualizerChain, setBandGain, applyPreset, gains, currentPreset } = useEqualizer(audioCtx);

    // Гарантированная инициализация AudioContext
    const ensureAudioCtx = useCallback(() => {
        if (audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);
        return ctx;
    }, [audioCtx]);

    // Создание цепочки Audio Nodes при появлении audioCtx
    useEffect(() => {
        if (!audioCtx) return;

        const eqChain = createEqualizerChain();
        if (!eqChain) return;

        eqChain.outputNode.connect(audioCtx.destination);

        const engine = new CrossfadeEngine(audioCtx, eqChain.inputNode);
        engineRef.current = engine;
    }, [audioCtx, createEqualizerChain]);

    // Загрузка пиков Waveform с обработкой ошибок (.catch)
    useEffect(() => {
        if (!currentTrack) return;

        let isCancelled = false;
        setIsLoadingPeaks(true);

        extractPeaks(currentTrack.url, 80)
            .then((extractedPeaks) => {
                if (!isCancelled) {
                    setPeaks(extractedPeaks);
                    setIsLoadingPeaks(false);
                }
            })
            .catch((err) => {
                console.error('Failed to extract audio peaks:', err);
                if (!isCancelled) {
                    setPeaks([]);
                    setIsLoadingPeaks(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentTrack]);

    // Переключение трека с кроссфейдом
    const handleNextTrack = async () => {
        const ctx = ensureAudioCtx();

        const nextIndex = (currentTrackIndex + 1) % DEMO_PLAYLIST.length;
        const nextTrack = DEMO_PLAYLIST[nextIndex];

        // Если engineRef ещё не успел создаться в useEffect (первый клик), ждём микротаск
        if (!engineRef.current && ctx) {
            const eqChain = createEqualizerChain();
            if (eqChain) {
                eqChain.outputNode.connect(ctx.destination);
                engineRef.current = new CrossfadeEngine(ctx, eqChain.inputNode);
            }
        }

        if (nextTrack && engineRef.current) {
            setCurrentTrackIndex(nextIndex);
            await engineRef.current.playNextTrack(nextTrack.url);
        }
    };

    // Перемотка трека по клику на Waveform
    const handleSeek = (time: number) => {
        setCurrentTime(time);
        // В CrossfadeEngine нужно будет добавить метод getCurrentDeck().currentTime = time
    };

    return (
        <div
            className="p-6 max-w-xl mx-auto bg-zinc-900 text-white rounded-xl shadow-2xl space-y-6"
            onClick={ensureAudioCtx}
        >
            {/* Информация о треке */}
            <div>
                <h2 className="text-xl font-bold">{currentTrack?.title ?? 'Unset'}</h2>
                <p className="text-sm text-zinc-400">{currentTrack?.artist ?? 'Unknown'}</p>
            </div>

            {/* Waveform Seekbar */}
            <div className="bg-zinc-800 p-4 rounded-lg">
                {isLoadingPeaks ? (
                    <div className="h-12 flex items-center justify-center text-xs text-zinc-500">
                        Загрузка волны...
                    </div>
                ) : (
                    <WaveformSeekbar
                        peaks={peaks}
                        currentTime={currentTime}
                        duration={duration || 180}
                        onSeek={handleSeek}
                    />
                )}
            </div>

            {/* Контроллеры плеера */}
            <div className="flex gap-4">
                <button
                    onClick={handleNextTrack}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition active:scale-95"
                >
                    Следующий трек (Crossfade)
                </button>
            </div>

            {/* UI Эквалайзера */}
            <div className="border-t border-zinc-800 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Эквалайзер</span>
                    <select
                        value={currentPreset}
                        onChange={(e) => applyPreset(e.target.value as PresetName)}
                        className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 outline-none"
                    >
                        {Object.keys(EQ_PRESETS).map((preset) => (
                            <option key={preset} value={preset}>
                                {preset.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Ползунки полос эквалайзера */}
                <div className="flex justify-between gap-2">
                    {FREQUENCIES.map((freq, idx) => {
                        const gain = gains[idx] ?? 0;
                        return (
                            <div key={freq} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] text-zinc-400">{gain > 0 ? `+${gain}` : gain}dB</span>
                                <input
                                    type="range"
                                    min="-12"
                                    max="12"
                                    step="1"
                                    value={gain}
                                    onChange={(e) => setBandGain(idx, Number(e.target.value))}
                                    className="h-24 [writing-mode:vertical-lr] [direction:rtl] cursor-pointer"
                                />
                                <span className="text-[10px] text-zinc-400">
                                    {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};