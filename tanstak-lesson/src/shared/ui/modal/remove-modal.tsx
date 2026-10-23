import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10005] overflow-y-auto overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in" />

            <div
                className="relative flex min-h-full items-center justify-center p-3 sm:p-4"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div
                    className={`animate-modal-in relative flex w-full ${maxWidth} flex-col gap-4 overflow-hidden rounded-3xl border border-pink-200/10 bg-zinc-950/95 p-5 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(249,92,158,0.35)] sm:p-6`}
                >
                    {/* Розовое свечение сверху */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-pink-400/20 blur-3xl"
                    />

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-3 top-3 z-20 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white/[0.07] text-zinc-400 transition-colors hover:bg-white/15 hover:text-white sm:right-4 sm:top-4"
                        title="Закрыть"
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>

                    {title && (
                        <h2 className="relative w-full px-9 text-center font-display text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
                            {title}
                        </h2>
                    )}

                    <div className="relative flex w-full min-w-0 flex-col">{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
};