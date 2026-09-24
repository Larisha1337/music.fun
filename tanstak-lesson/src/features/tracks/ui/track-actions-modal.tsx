import { useState } from "react";
import { TrackMenuView } from "./track-menu-view.tsx";
import { EditTrackForm } from "./edit/edit-track-form.tsx";
import { DeleteTrackView } from "./delete/delete-track-view.tsx";

type Props = {
    trackId: string;
    title: string;
    coverUrl?: string | null;
    isOpen: boolean;
    onClose: () => void;
};

export const TrackActionsModal = ({ trackId, title, coverUrl, isOpen, onClose }: Props) => {
    const [mode, setMode] = useState<"menu" | "edit" | "delete">("menu");

    if (!isOpen) return null;

    // Полное закрытие модалки (крестик или успешное действие)
    const handleClose = () => {
        setMode("menu");
        onClose();
    };

    // Возврат к выбору действия (кнопка "Назад")
    const handleBack = () => {
        setMode("menu");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-3xl p-8 shadow-2xl text-zinc-100">

                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-5 right-5 z-30 text-zinc-400 hover:text-white text-xl font-bold transition-colors cursor-pointer"
                >
                    ✕
                </button>

                {mode === "menu" && (
                    <TrackMenuView
                        title={title}
                        onEdit={() => setMode("edit")}
                        onDelete={() => setMode("delete")}
                    />
                )}

                {mode === "edit" && (
                    <EditTrackForm
                        trackId={trackId}
                        initialTitle={title}
                        initialCoverUrl={coverUrl}
                        onSuccess={handleClose}
                        onCancel={handleBack}
                    />
                )}

                {mode === "delete" && (
                    <DeleteTrackView
                        trackId={trackId}
                        title={title}
                        onCancel={handleBack}
                        onSuccess={handleClose}
                    />
                )}
            </div>
        </div>
    );
};