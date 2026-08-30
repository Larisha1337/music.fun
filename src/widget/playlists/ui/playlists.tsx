import { useState } from "react";
import { usePlaylistsQuery } from "../api/usePlaylistsQuery.ts";
import { useMeQuery } from "../../../hooks/useMyQuery.ts"; // 💡 Подтянули юзера наверх
import { IsError } from "../../../features/query-status/isError.tsx";
import { IsPending } from "../../../features/query-status/isPending.tsx";
import { Pagination } from "../../../shared/ui/pagination/pagination.tsx";
import { Lists } from "./';'/lists.tsx";

type Props = {
    userId?: string;
};

export const Playlist = ({ userId: propsUserId }: Props) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data: meData } = useMeQuery();
    const currentUserId = meData?.userId;

    // @ts-ignore
    const [userId, setUserId] = useState<string | null>(propsUserId ?? null);

    const query = usePlaylistsQuery(page, search, userId);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    if (query.isLoading) return <IsPending />;
    if (query.isError) return <IsError onRetry={query.refetch} />;
    if (!query.data) return null;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
            {/* Поиск */}
            <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Поиск плейлистов..."
                className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all text-sm sm:text-base shadow-sm"
            />

            {/* Пагинация */}
            <Pagination
                pagesCount={query.data.meta.pagesCount}
                currentPage={page}
                onPageNumberChange={setPage}
                isFetching={query.isFetching}
            />

            {/* Список плейлистов (передаем готовые данные) */}
            <Lists
                playlists={query.data.data}
                currentUserId={currentUserId}
            />
        </div>
    );
};