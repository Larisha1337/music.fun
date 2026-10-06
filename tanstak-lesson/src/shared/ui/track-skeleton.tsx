export const TrackSkeleton = () => {
    return (
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl relative overflow-hidden animate-pulse">
            {/* Кнопка Play */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800/80 shrink-0" />

            {/* Обложка */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-zinc-800/80 shrink-0" />

            {/* Текст */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                <div className="h-4 sm:h-5 bg-zinc-800/80 rounded-md w-3/4" />
                <div className="h-3.5 sm:h-4 bg-zinc-800/50 rounded-md w-1/2" />
            </div>

            {/* Кнопки справа */}
            <div className="hidden sm:block w-10 h-10 rounded-xl bg-zinc-800/80 shrink-0" />
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/80 shrink-0" />
        </div>
    );
};