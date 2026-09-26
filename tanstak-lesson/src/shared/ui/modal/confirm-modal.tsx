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
                             }: ConfirmModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
            <div className="flex justify-end gap-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                        isDanger
                            ? "bg-red-600 hover:bg-red-500"
                            : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                >
                    {isLoading ? "Обработка..." : confirmText}
                </button>
            </div>
        </Modal>
    );
};