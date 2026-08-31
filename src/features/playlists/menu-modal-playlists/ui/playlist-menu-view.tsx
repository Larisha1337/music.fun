type Props = {
    title: string;
    onEdit: () => void;
    onDelete: () => void;
};

export const PlaylistMenuView = ({ title, onEdit, onDelete }: Props) => {
    return (
        <div className="flex flex-col items-center gap-6 mt-2">

            {/* Заголовок плейлиста */}
            <h3 className="text-xl font-bold text-zinc-100 text-center tracking-tight">
                {title}
            </h3>
            <p className="text-zinc-400 text-sm">
                Выберите действие для этого плейлиста
            </p>

            {/* 💡 Обертка для кнопок, которая ставит их в ряд */}
            <div className="flex items-center justify-between gap-4 w-full">

                {/* Кнопка "Изменить" (слева) */}
                <button
                    onClick={onEdit}
                    className="flex-1 py-3 bg-zinc-800/40 hover:bg-zinc-800 border border-[#27272a] hover:border-zinc-700 text-zinc-300 font-semibold rounded-xl transition-all cursor-pointer"
                >
                    Изменить
                </button>

                {/* Кнопка "Удалить" (справа) - можно сделать её красноватой для понимания опасности */}
                <button
                    onClick={onDelete}
                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-900/50 hover:border-red-500 text-red-500 font-semibold rounded-xl transition-all cursor-pointer"
                >
                    Удалить
                </button>

            </div>
        </div>
    );
};