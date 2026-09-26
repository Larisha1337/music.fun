import { useEffect, type ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    maxWidth?: string;
}

export const Modal = ({
                          isOpen,
                          onClose,
                          title,
                          children,
                          maxWidth = "max-w-xl"
                      }: ModalProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            {/* Оверлей */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* Модальное окно с фиксацией переполнения */}
            <div
                className={`relative w-full ${maxWidth} bg-[#18181b] border border-[#27272a] rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-zinc-100 overflow-hidden box-border`}
            >
                {/* Кнопка закрытия */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer z-20"
                    title="Закрыть"
                >
                    ✕
                </button>

                {/* Заголовок */}
                {title && (
                    <h2 className="text-xl font-bold text-white text-center w-full px-8">
                        {title}
                    </h2>
                )}

                {/* Контент */}
                <div className="w-full flex flex-col min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
};