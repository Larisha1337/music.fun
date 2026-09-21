import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

export const useCoverColor = (coverSrc: string | null, defaultColor = '#6366f1') => {
    const [color, setColor] = useState<string>(defaultColor);

    useEffect(() => {
        if (!coverSrc) {
            setColor(defaultColor);
            return;
        }

        let isMounted = true;

        fac.getColorAsync(coverSrc, { crossOrigin: 'anonymous' })
            .then((res) => {
                if (isMounted) {
                    setColor(res.hex);
                }
            })
            .catch(() => {
                // Если сработал CORS или обложка не загрузилась — ставим дефолтный цвет
                if (isMounted) setColor(defaultColor);
            });

        return () => {
            isMounted = false;
        };
    }, [coverSrc, defaultColor]);

    return color;
};