import { useState, useCallback } from 'react';
import {createPortal} from "react-dom";

export const usePictureInPicture = () => {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

    const togglePip = useCallback(async () => {
        if (!isSupported) {
            alert('Document Picture-in-Picture доступен в Chrome или Edge версии 116+');
            return;
        }

        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            return;
        }

        try {
            // Задаем чуть более просторное и сбалансированное окно для крутого визуала
            const pipWin = await (window as any).documentPictureInPicture.requestWindow({
                width: 380,
                height: 180,
            });

            // Копируем стили из основного документа
            for (let i = 0; i < document.styleSheets.length; i++) {
                const styleSheet = document.styleSheets[i];
                if (!styleSheet) continue;

                try {
                    let cssRules = '';
                    const rules = styleSheet.cssRules;
                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j];
                        if (rule) cssRules += rule.cssText;
                    }

                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWin.document.head.appendChild(style);
                } catch (e) {
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        if (styleSheet.type) link.type = styleSheet.type;
                        link.href = styleSheet.href;
                        pipWin.document.head.appendChild(link);
                    }
                }
            }

            // Базовый фон и сброс отступов для PiP окна
            pipWin.document.body.className = "bg-[#09090b] text-white overflow-hidden m-0 p-0 select-none flex h-full w-full";

            pipWin.addEventListener('pagehide', () => {
                setPipWindow(null);
            });

            setPipWindow(pipWin);
        } catch (err) {
            console.error('Не удалось открыть Picture-in-Picture:', err);
        }
    }, [pipWindow, isSupported]);

    const renderPip = (children: React.ReactNode) => {
        if (!pipWindow) return null;
        return createPortal(children, pipWindow.document.body);
    };

    return {
        isPipOpen: !!pipWindow,
        isSupported,
        togglePip,
        renderPip
    };
};