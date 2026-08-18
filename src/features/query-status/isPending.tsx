export const IsPending = () => {
    return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse"
                    >
                        {/* Обводка под иконку/картинку */}
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0"/>

                        {/* Текстовые полоски */}
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded bg-zinc-800"/>
                            <div className="h-3 w-1/2 rounded bg-zinc-800/60"/>
                        </div>
                    </div>
                ))}
            </div>
        )
}