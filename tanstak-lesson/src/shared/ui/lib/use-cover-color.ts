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

        // 🔽 1. ВСТАВЛЯЕМ ПОДМЕНУ URL ЗДЕСЬ
        // Превращаем https://pub-...r2.dev/track-covers/... в /r2-proxy/track-covers/...
        const targetUrl = coverSrc.replace(
            'https://pub-3387ec0d355d404daf0dcee5485caf3e.r2.dev',
            '/r2-proxy'
        );

        // 🔽 2. Передаем targetUrl
        // { crossOrigin: 'anonymous' } больше не нужен, так как для браузера это теперь запрос к http://localhost:5173
        fac.getColorAsync(targetUrl)
            .then((res) => {
                if (isMounted) {
                    setColor(res.hex);
                }
            })
            .catch(() => {
                if (isMounted) setColor(defaultColor);
            });

        return () => {
            isMounted = false;
        };
    }, [coverSrc, defaultColor]);

    return color;
};