import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { client } from "../shared/api/client.ts";

export const usePlaylistsQuery = (page: number, search: string) => {
    return useQuery({
        queryKey: ['playlists', page, search],
        queryFn: async ({ signal }) => {
            const response = await client.GET('/playlists', {
                params: {
                    query: { pageNumber: page, search }
                },
                signal
            });
            if (response.error) {
                throw (response as unknown as { error: Error }).error;
            }
            return response.data;
        },
        placeholderData: keepPreviousData,
        retry: 2,
        // 💡 Трансформируем данные и сужаем типы
        select: (data) => ({
            ...data,
            data: data.data.filter((playlist) =>
                Boolean(playlist.attributes.images.main?.[0]?.url)
            )
        })
    });
};