import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export const usePictureInPicture = () => {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    // Проверка поддержки браузером (Chrome / Edge 116+)
    const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

    const togglePip = useCallback(async () => {
        if (!isSupported) {
            alert('Document Picture-in-Picture доступен в Chrome или Edge версии 116+');
            return;
        }

        // Если окно уже открыто — закрываем его
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            return;
        }

        try {
            // 1. Запрашиваем создание нового плавающего окна
            const pipWin = await (window as any).documentPictureInPicture.requestWindow({
                width: 360,
                height: 160,
            });

            // 2. Безопасно копируем CSS стили из основного окна
            for (let i = 0; i < document.styleSheets.length; i++) {
                const styleSheet = document.styleSheets[i];
                if (!styleSheet) continue; // Устраняет TS18048 для styleSheet

                try {
                    let cssRules = '';
                    const rules = styleSheet.cssRules;

                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j];
                        if (rule) { // Устраняет TS2532 для rules[j]
                            cssRules += rule.cssText;
                        }
                    }

                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWin.document.head.appendChild(style);
                } catch (e) {
                    // Обработка внешних стилей (CORS)
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        if (styleSheet.type) {
                            link.type = styleSheet.type;
                        }
                        link.href = styleSheet.href;
                        pipWin.document.head.appendChild(link);
                    }
                }
            }

            // 3. Базовая стилизация документа плавающего окна
            pipWin.document.body.className = "bg-[#18181b] text-white overflow-hidden m-0 p-3 select-none flex items-center justify-center h-full";

            // 4. Обработчик естественного закрытия окна пользователем
            pipWin.addEventListener('pagehide', () => {
                setPipWindow(null);
            });

            setPipWindow(pipWin);
        } catch (err) {
            console.error('Не удалось открыть Picture-in-Picture:', err);
        }
    }, [pipWindow, isSupported]);

    // Функция-рендерер через React Portal
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