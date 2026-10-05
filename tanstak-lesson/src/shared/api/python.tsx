import { useEffect, useState } from 'react';

export default function AudioVisualizer() {
    const [spectrum, setSpectrum] = useState([]);

    useEffect(() => {
        // Подключаемся к Python WebSocket серверу
        const ws = new WebSocket('ws://localhost:8765');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.spectrum) {
                // Берем только первые 6-8 полос, чтобы аккуратно поместиться в панель
                setSpectrum(data.spectrum.slice(0, 8));
            }
        };

        return () => ws.close();
    }, []);

    return (
        <div className="flex items-end gap-1 h-6 px-2">
            {spectrum.map((val, index) => (
                <div
                    key={index}
                    style={{
                        height: `${Math.max(4, (val / 100) * 24)}px`,
                    }}
                    className="w-1 bg-indigo-500 rounded-t transition-all duration-75"
                />
            ))}
        </div>
    );
}