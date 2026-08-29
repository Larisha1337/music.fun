import { useState } from "react";
import { EditPlaylistForm } from "./form/edit-playlists-form.tsx"; // путь к твоей форме редактирования

type Props = {
    playlistId: string;
    initialTitle: string;
    initialDescription?: string | null;
};

export const EditPlaylistModal = ({ playlistId, initialTitle, initialDescription }: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-sm rounded-xl transition-all cursor-pointer"
            >
                Изменить
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="relative max-w-lg w-full">
                        {/* Кнопка закрытия крестиком */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10 text-xl font-bold cursor-pointer"
                        >
                            ✕
                        </button>

                        <EditPlaylistForm
                            playlistId={playlistId}
                            initialTitle={initialTitle}
                            initialDescription={initialDescription || ''}
                            onSuccess={() => setIsOpen(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};