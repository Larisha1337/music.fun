import { useRef, useState, useCallback } from 'react';

export const FREQUENCIES = [60, 230, 910, 3600, 14000] as const;

export type PresetName = 'flat' | 'bassBoost' | 'pop' | 'rock' | 'vocal';

export const EQ_PRESETS: Record<PresetName, number[]> = {
    flat: [0, 0, 0, 0, 0],
    bassBoost: [7, 4, 0, -1, -2],
    pop: [-1, 2, 5, 3, -2],
    rock: [5, 3, -1, 3, 5],
    vocal: [-3, 1, 5, 3, -1],
};

export const useEqualizer = (audioCtx: AudioContext | null) => {
    const filtersRef = useRef<BiquadFilterNode[]>([]);
    const [gains, setGains] = useState<number[]>(EQ_PRESETS.flat);
    const [currentPreset, setCurrentPreset] = useState<PresetName>('flat');

    // Инициализация цепи фильтров
    const createEqualizerChain = useCallback(() => {
        if (!audioCtx) return null;

        const filters = FREQUENCIES.map((freq, index) => {
            const filter = audioCtx.createBiquadFilter();

            if (index === 0) {
                filter.type = 'lowshelf';
            } else if (index === FREQUENCIES.length - 1) {
                filter.type = 'highshelf';
            } else {
                filter.type = 'peaking';
                filter.Q.value = 1.4; // Ширина полосы
            }

            filter.frequency.value = freq;
            filter.gain.value = gains[index] ?? 0;
            return filter;
        });

        // Соединяем фильтры последовательно: 0 -> 1 -> 2 -> 3 -> 4
        for (let i = 0; i < filters.length - 1; i++) {
            const currentFilter = filters[i];
            const nextFilter = filters[i + 1];

            if (currentFilter && nextFilter) {
                currentFilter.connect(nextFilter);
            }
        }

        filtersRef.current = filters;

        const inputNode = filters[0];
        const outputNode = filters[filters.length - 1];

        if (!inputNode || !outputNode) return null;

        return {
            inputNode,
            outputNode,
        };
    }, [audioCtx, gains]);

    // Изменение конкретной частоты
    const setBandGain = (index: number, gainValue: number) => {
        const filter = filtersRef.current[index];
        if (filter && audioCtx) {
            filter.gain.setValueAtTime(gainValue, audioCtx.currentTime);

            const newGains = [...gains];
            newGains[index] = gainValue;
            setGains(newGains);
            setCurrentPreset('flat'); // При ручной настройке сбрасываем имя пресета
        }
    };

    // Применение пресета
    const applyPreset = (presetName: PresetName) => {
        const presetValues = EQ_PRESETS[presetName];
        if (!presetValues) return;

        presetValues.forEach((gainVal, idx) => {
            const filter = filtersRef.current[idx];
            if (filter && audioCtx) {
                filter.gain.setValueAtTime(gainVal, audioCtx.currentTime);
            }
        });

        setGains(presetValues);
        setCurrentPreset(presetName);
    };

    return {
        createEqualizerChain,
        setBandGain,
        applyPreset,
        gains,
        currentPreset,
    };
};