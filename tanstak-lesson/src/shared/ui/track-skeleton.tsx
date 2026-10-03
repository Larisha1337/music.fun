export const TrackSkeleton = () => {
    return (
        <div className="flex items-center gap-4 p-4 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl relative overflow-hidden animate-pulse">
            {/* Кнопка Play */}
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 shrink-0" />

            {/* Обложка */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-800/80 shrink-0" />

            {/* Текст */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2.5">
                <div className="h-5 bg-zinc-800/80 rounded-md w-2/3" />
                <div className="h-4 bg-zinc-800/50 rounded-md w-1/3" />
            </div>

            {/* Кнопки справа */}
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 shrink-0" />
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 shrink-0" />
        </div>
    );
};