import { useState } from "react";
import { usePlaylistsQuery } from "../../../hooks/usePlaylistsQuery.ts";
import { useMeQuery } from "../../../hooks/useMyQuery.ts";
import { IsError } from "../../../features/query-status/isError.tsx";
import { IsPending } from "../../../features/query-status/isPending.tsx";
import { Pagination } from "../../../shared/ui/pagination/pagination.tsx";
import { DeletePlaylists } from "../../../features/playlists/delete-playlists/ui/delete-playlists.tsx";

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

            {/* Список плейлистов */}
            <ul className="flex flex-col gap-4">
                {query.data.data.map((playlist) => {
                    const imageUrl = playlist.attributes.images.main?.[0]?.url;
                    const isOwner = Boolean(currentUserId && playlist.attributes.user.id === currentUserId);

                    return (
                        <li key={playlist.id}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#18181b]/60 border border-[#27272a] rounded-2xl transition-all hover:border-zinc-700">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={playlist.attributes.title}
                                            className="w-full sm:w-[250px] h-[100px] sm:h-[250px] object-cover rounded-xl shrink-0"
                                        />
                                    ) : (
                                        <div className="w-full sm:w-[160px] h-[100px] sm:h-[50px] bg-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-500 shrink-0">
                                            No cover
                                        </div>
                                    )}

                                    <span className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight break-all">
                            {playlist.attributes.title}
                        </span>
                                </div>

                                {isOwner && (
                                    <div className="w-full sm:w-auto flex justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                                        <DeletePlaylists playlistId={playlist.id} />
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};