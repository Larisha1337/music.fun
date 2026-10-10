export const TrackSkeleton = () => (
    <div className="track-card flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl animate-pulse">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 shrink-0" />
        <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl bg-white/10 shrink-0" />

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <div className="h-4 sm:h-5 bg-white/10 rounded-md w-3/4" />
            <div className="h-3.5 sm:h-4 bg-white/[0.06] rounded-md w-1/2" />
        </div>

        <div className="hidden sm:block w-10 h-10 rounded-full bg-white/10 shrink-0" />
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 shrink-0" />
    </div>
);