export const TrackSkeleton = () => {
    return (
        <div className="flex items-center gap-4 p-4 bg-[#18181b]/90 border border-[#27272a] rounded-2xl animate-pulse">
            {/* Кнопка Play */}
            <div className="w-12 h-12 rounded-full bg-zinc-800 shrink-0" />

            {/* Обложка */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-800 shrink-0" />

            {/* Текст (название и автор) */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                <div className="h-5 bg-zinc-800 rounded-md w-3/4" />
                <div className="h-4 bg-zinc-800 rounded-md w-1/2" />
            </div>

            {/* Кнопки справа (лайк, опции) */}
            <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
            <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
        </div>
    );
};