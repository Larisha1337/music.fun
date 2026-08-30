type Props = {
    title: string;
    onEdit: () => void;
    onDelete: () => void;
};

export const PlaylistMenuView = ({ title, onEdit, onDelete }: Props) => {
    return (
        <div className="space-y-6 text-center">
            <h3 className="text-2xl font-extrabold text-white break-all">
                {title}
            </h3>
            <p className="text-zinc-400 text-sm">
                Выберите действие для этого плейлиста
            </p>

            <div className="flex flex-col gap-3 pt-2">
                <button
                    onClick={onEdit}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg cursor-pointer"
                >
                    Изменить
                </button>
                <button
                    onClick={onDelete}
                    className="w-full py-3.5 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg cursor-pointer"
                >
                    Удалить
                </button>
            </div>
        </div>
    );
};