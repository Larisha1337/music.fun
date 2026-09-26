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
            <div className="flex flex-col items-center justify-center gap-4 w-full">
                {/* Текст описания строго по центру */}
                <p className="text-sm text-zinc-300 leading-relaxed text-center max-w-sm">
                    {description}
                </p>

                {/* Равномерно отцентрированные кнопки одинаковой ширины */}
                <div className="flex items-center justify-center gap-3 w-full mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 text-xs font-semibold text-zinc-300 bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] rounded-xl transition-colors cursor-pointer text-center"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-2.5 px-4 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50 text-center ${
                            isDanger
                                ? "bg-red-600 hover:bg-red-500"
                                : "bg-indigo-600 hover:bg-indigo-500"
                        }`}
                    >
                        {isLoading ? "Обработка..." : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};