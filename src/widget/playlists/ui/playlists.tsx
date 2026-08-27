import { useState } from "react";
import { usePlaylistsQuery } from "../../../hooks/usePlaylistsQuery.ts";
import { IsError } from "../../../features/query-status/isError.tsx";
import { IsPending } from "../../../features/query-status/isPending.tsx";
import { Pagination } from "../../../shared/ui/pagination/pagination.tsx";

type Props = {
    userId?: string;
};

export const Playlist = ({ userId: propsUserId }: Props) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

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
        <div>
            <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Поиск плейлистов..."
            />
            <Pagination
                pagesCount={query.data.meta.pagesCount}
                currentPage={page}
                onPageNumberChange={setPage}
                isFetching={query.isFetching}
            />
            <ul>
                {query.data.data.map((playlist) => {
                    const imageUrl = playlist.attributes.images.main?.[0]?.url;

                    return (
                        <li key={playlist.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                {/* 💡 Показываем изображение или серый плейсхолдер */}
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={playlist.attributes.title}
                                        width={250}
                                        height={50}
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="w-[250px] h-[50px] bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">
                                        No cover
                                    </div>
                                )}
                                <span style={{ fontSize: '28px', fontWeight: 800 }}>
                    {playlist.attributes.title}
                </span>
                            </div>
                            <hr style={{ borderColor: '#27272a', margin: '16px 0' }} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};