import {usePlaylistsQuery} from "../hooks/usePlaylistsQuery.ts";
import {IsError} from "./query-status/isError.tsx";
import {IsPending} from "./query-status/isPending.tsx";
import {Pagination} from "../shared/ui/pagination/pagination.tsx";
import {useState} from "react";

export const Playlist = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');



    const query = usePlaylistsQuery(page, search);

    // 💡 Хэндлер для ввода текста: сбрасывает страницу на 1
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    if (query.isLoading) return <IsPending/>
    if (query.isError) return <IsError onRetry={query.refetch} />;

    if (!query.data) return null;

    return (
        <div>
            {/* Поле ввода для поиска */}
            <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Поиск плейлистов..."
            />
            <Pagination pagesCount={query.data.meta.pagesCount}
                        currentPage={page}
                        onPageNumberChange={setPage}
                        isFetching={query.isFetching}
            />
            <ul>
                {query.data?.data
                    .filter((playlist) => playlist.attributes.images.main?.[0]?.url)
                    .map(playlist => {
                    return (
                        <li key={playlist.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                {playlist.attributes.images.main?.[0]?.url && (
                                    <div>
                                    <img
                                        src={playlist.attributes.images.main[0].url}
                                        alt={playlist.attributes.title}
                                        width={250}
                                        height={50}
                                    />
                                        <span style={{ fontSize: '28px', fontWeight: 800 }}>{playlist.attributes.title}</span>
                                    </div>
                                )}

                            </div>
                            <hr style={{ borderColor: '#27272a', margin: '16px 0' }} />
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

