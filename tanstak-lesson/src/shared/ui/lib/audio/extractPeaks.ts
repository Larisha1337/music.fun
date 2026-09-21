// shared/lib/audio/extractPeaks.ts

export const extractPeaks = async (
    audioUrl: string,
    samplesCount: number = 100
): Promise<number[]> => {
    try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0); // Берем первый моно/левый канал
        const blockSize = Math.floor(rawData.length / samplesCount);
        const peaks: number[] = [];

        for (let i = 0; i < samplesCount; i++) {
            const start = blockSize * i;
            let max = 0;
            for (let j = 0; j < blockSize; j++) {
                const sample = rawData[start + j] ?? 0;
                const val = Math.abs(sample);
                if (val > max) max = val;
            }
            peaks.push(Number(max.toFixed(2)));
        }

        // Закрываем временный контекст
        await audioCtx.close();

        return peaks;
    } catch (error) {
        console.error('Failed to extract audio peaks:', error);
        // Возвращаем фейковые пики в случае ошибки
        return Array.from({ length: samplesCount }, () => Math.random() * 0.7 + 0.2);
    }
};