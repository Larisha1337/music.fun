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
                          maxWidth = "max-w-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={onClose} />
            <div
                className={`relative w-full ${maxWidth} bg-[#18181b] border border-[#27272a] rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-zinc-100`}
            >
                <div className="flex items-center justify-between">
                    {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors ml-auto cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};