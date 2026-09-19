import { useState } from "react";
import { usePlaylistsQuery } from "../api/usePlaylistsQuery.ts";
import { useMeQuery } from "../../../hooks/useMeQuery.ts";
import { IsError } from "../../../features/query-status/isError.tsx";
import { IsPending } from "../../../features/query-status/isPending.tsx";
import { Pagination } from "../../../shared/ui/pagination/pagination.tsx";
import { Lists } from "@/widget/playlists/ui/playlists-lists.tsx"; // Исправлен путь
import { useDebounce } from "../api/debounce/useDebounce.ts";

type Props = {
    userId?: string;
    search: string;
    onSearchChange: (value: string) => void;
    page: number;
    setPage: (page: number) => void;
};

export const Playlist = ({ userId: propsUserId, search, page, setPage }: Props) => {
    const debouncedSearch = useDebounce(search, 400);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [userId, setUserId] = useState<string | null>(propsUserId ?? null);

    const { data: meData } = useMeQuery();
    const currentUserId = meData?.userId;

    const query = usePlaylistsQuery(page, debouncedSearch, userId);

    if (query.isLoading) return <IsPending />;
    if (query.isError) return <IsError onRetry={query.refetch} />;
    if (!query.data) return null;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
            {/* Пагинация */}
            <Pagination
                pagesCount={query.data.meta.pagesCount}
                currentPage={page}
                onPageNumberChange={setPage}
                isFetching={query.isFetching}
            />

            {/* Список плейлистов */}
            <Lists
                playlists={query.data.data}
                currentUserId={currentUserId}
            />
        </div>
    );
};