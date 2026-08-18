import {usePlaylistsQuery} from "../../hooks/usePlaylistsQuery.ts";

export const IsError = () => {
    const query = usePlaylistsQuery();
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-zinc-300">
        <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span className="text-sm font-medium"> Сбой подключения к API </span>
    </div>

    <button
    onClick={() => query.refetch()}
    className="px-9 py-3.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700"
        >
        Повторить
        </button>
        </div>
)
}