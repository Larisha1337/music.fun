import { useState } from "react";
import { usePlaylistsQuery } from "../../../hooks/usePlaylistsQuery.ts";
import { useMeQuery } from "../../../hooks/useMyQuery.ts"; // 💡 Импортируем твой хук
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

    // 💡 1. Получаем текущего пользователя из useMeQuery
    const { data: meData } = useMeQuery();

    // Вытаскиваем ID (в зависимости от формата ответа бэка: meData.id или meData.data.id)
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

                    // 💡 2. Сравниваем ID текущего юзера с ID автора плейлиста
                    // (Проверь в консоли/типах, где лежит id создателя: playlist.attributes.userId или playlist.userId)
                    const isOwner = Boolean(currentUserId && playlist.attributes.user.id === currentUserId);

                    return (
                        <li key={playlist.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
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
                                    {playlist.attributes.title}{' '}
                                    {/* 💡 3. Кнопка монтируется только если isOwner === true */}
                                    {isOwner && <DeletePlaylists playlistId={playlist.id} />}
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