import { useState } from "react";
import { useDeleteMutation } from "../api/use-delete-mutation.ts";

type Props = {
    playlistId: string;
};

export const DeletePlaylists = ({ playlistId }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const { mutate, isPending } = useDeleteMutation();

    const handleDelete = () => {
        mutate(playlistId, {
            onSuccess: () => setIsOpen(false),
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition-all cursor-pointer"
            >
                Удалить
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    {/* text-center центрирует заголовки и текст, p-8 дает большие внутренние отступы */}
                    <div className="bg-[#18181b] border border-[#27272a] p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-5 text-zinc-100">
                        <h3 className="text-2xl font-extrabold text-white">
                            Удалить плейлист?
                        </h3>

                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Вы точно хотите удалить этот плейлист? <br />
                            Это действие нельзя будет отменить.
                        </p>

                        {/* justify-center ставит кнопки ровно посередине */}
                        <div className="flex items-center justify-center gap-4 pt-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                                className="px-6 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                                Отмена
                            </button>

                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
                            >
                                {isPending ? "Удаление..." : "Удалить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};