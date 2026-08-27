import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { client } from "../shared/api/client.ts";

// 💡 Делаем userId опциональным (number | null | undefined)
export const usePlaylistsQuery = (page: number, search: string, userId?: string | null) => {
    return useQuery({
        queryKey: ['playlists', page, search, userId],
        queryFn: async ({ signal }) => {
            const response = await client.GET('/playlists', {
                params: {
                    query: {
                        pageNumber: page,
                        search: search || undefined,
                        // 💡 Прокидываем userId в API (если null/undefined — передастся undefined и параметр опустится)
                        userId: userId ?? undefined
                    }
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
        // 💡 Фильтрация по наличию обложки делается один раз здесь
        // select: (data) => ({
        //     ...data,
        //     data: data.data.filter((playlist) =>
        //         Boolean(playlist.attributes.images.main?.[0]?.url)
        //     )
        // })
    });
};