import { useQuery } from '@tanstack/react-query';
import { client } from "../shared/api/client.ts";

export const useMyPlaylistsQuery = () => {
    return useQuery({
        queryKey: ['my-playlists'],
        queryFn: async ({ signal }) => {
            const response = await client.GET('/playlists', { signal });
            if (response.error) {
                throw (response as unknown as { error: Error }).error;
            }
            return response.data;
        },
        retry: 2,
        // 💡 Единая логика фильтрации: отсекаем плейлисты без картинок прямо в хуке
        select: (data) => ({
            ...data,
            data: data?.data.filter((playlist) =>
                Boolean(playlist.attributes.images.main?.[0]?.url)
            )
        })
    });
};