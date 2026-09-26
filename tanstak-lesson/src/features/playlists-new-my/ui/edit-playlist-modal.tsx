import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "@/shared/ui/modal/remove-modal.tsx";

interface EditPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialName: string;
    onSave: (formData: FormData) => void;
    isUpdating?: boolean;
}

export const EditPlaylistModal = ({
                                      isOpen,
                                      onClose,
                                      initialName,
                                      onSave,
                                      isUpdating
                                  }: EditPlaylistModalProps) => {
    const [name, setName] = useState(initialName);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setCoverFile(null);
        }
    }, [isOpen, initialName]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", name);
        if (coverFile) {
            formData.append("cover", coverFile);
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редактировать плейлист">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Название</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="px-3 py-2 text-sm bg-[#27272a] border border-[#3f3f46] rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Обложка плейлиста</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold hover:file:bg-indigo-500 cursor-pointer"
                    />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        Отмена
                    </button>

                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {isUpdating ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};