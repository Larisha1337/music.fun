import { useDeleteTrackMutation } from "../../api/delete/use-delete-track-mutation.ts";

type Props = {
    trackId: string;
    title: string;
    onCancel: () => void;
    onSuccess: () => void;
};

export const DeleteTrackView = ({ trackId, title, onCancel, onSuccess }: Props) => {
    const { mutate, isPending } = useDeleteTrackMutation(onSuccess);

    const handleDelete = () => {
        mutate(trackId);
    };

    return (
        <div className="space-y-5 text-center">
            <h3 className="text-2xl font-extrabold text-white">
                Удалить трек?
            </h3>

            <p className="text-zinc-400 text-sm leading-relaxed">
                Вы точно хотите удалить трек «<span className="text-white font-semibold">{title}</span>»? <br />
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
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                    {isPending ? "Удаление..." : "Удалить"}
                </button>
            </div>
        </div>
    );
};