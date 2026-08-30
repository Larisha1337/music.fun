import { useDeleteMutation } from "../api/use-delete-mutation.ts";

type Props = {
    playlistId: string;
    title: string;
    onCancel: () => void;
    onSuccess: () => void;
};

export const DeletePlaylistView = ({ playlistId, title, onCancel, onSuccess }: Props) => {
    const { mutate, isPending } = useDeleteMutation();

    const handleDelete = () => {
        mutate(playlistId, {
            onSuccess: () => onSuccess(),
        });
    };

    return (
        <div className="space-y-5 text-center">
            <h3 className="text-2xl font-extrabold text-white">
                Удалить плейлист?
            </h3>

            <p className="text-zinc-400 text-sm leading-relaxed">
                Вы точно хотите удалить плейлист «<span className="text-white font-semibold">{title}</span>»? <br />
                Это действие нельзя будет отменить.
            </p>

            <div className="flex items-center justify-center gap-4 pt-2">
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="px-6 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                    Назад
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
    );
};