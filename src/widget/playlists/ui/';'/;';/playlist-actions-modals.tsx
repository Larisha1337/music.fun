import { useState } from "react";
import { EditPlaylistForm } from "../../../../../features/playlists/edit-playlists/ui/form/edit-playlists-form.tsx";
import { DeletePlaylistView } from "../../../../../features/playlists/delete-playlists/ui/delete-playlists.tsx";
import { PlaylistMenuView } from "../../../../../features/playlists/menu-modal-playlists/ui/playlist-menu-view.tsx";
import { ModalCloseButton } from "../../../../../features/playlists/menu-modal-playlists/ui/button/modal-close-button.tsx";

type Props = {
    playlistId: string;
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
};

export const PlaylistActionsModal = ({
                                         playlistId,
                                         title,
                                         description,
                                         isOpen,
                                         onClose,
                                     }: Props) => {
    const [mode, setMode] = useState<"menu" | "edit" | "delete">("menu");

    if (!isOpen) return null;

    const handleClose = () => {
        setMode("menu");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-3xl p-8 shadow-2xl text-zinc-100">

                <ModalCloseButton onClick={handleClose} />

                {mode === "menu" && (
                    <PlaylistMenuView
                        title={title}
                        onEdit={() => setMode("edit")}
                        onDelete={() => setMode("delete")}
                    />
                )}

                {mode === "edit" && (
                    <EditPlaylistForm
                        playlistId={playlistId}
                        initialTitle={title}
                        initialDescription={description}
                        onSuccess={handleClose}
                    />
                )}

                {mode === "delete" && (
                    <DeletePlaylistView
                        playlistId={playlistId}
                        title={title}
                        onCancel={() => setMode("menu")}
                        onSuccess={handleClose}
                    />
                )}
            </div>
        </div>
    );
};