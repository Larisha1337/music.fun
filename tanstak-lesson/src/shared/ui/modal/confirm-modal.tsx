import { Modal } from "./remove-modal.tsx";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    isDanger?: boolean;
}

export const ConfirmModal = ({
                                 isOpen,
                                 onClose,
                                 onConfirm,
                                 title = "Подтверждение действия",
                                 description = "Вы уверены, что хотите продолжить?",
                                 confirmText = "Подтвердить",
                                 cancelText = "Отмена",
                                 isLoading = false,
                                 isDanger = true
                             }: ConfirmModalProps) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
        <div className="flex w-full flex-col items-center gap-5">
            <p className="max-w-sm text-center text-sm leading-relaxed text-zinc-300">{description}</p>

            <div className="flex w-full items-center gap-3">
                <button type="button" onClick={onClose} disabled={isLoading} className="btn-soft flex-1">
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={
                        isDanger
                            ? "inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-rose-500 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                            : "btn-accent flex-1"
                    }
                >
                    {isLoading ? "Обработка..." : confirmText}
                </button>
            </div>
        </div>
    </Modal>
);