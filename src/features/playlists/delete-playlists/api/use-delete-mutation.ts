import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";

type Playlist = {
    id: string;
    attributes: {
        title: string;
        description?: string | null;
        images: {
            main?: Array<{ url: string }>;
        };
    };
};

type PlaylistsResponse = {
    data: Playlist[];
    meta: {
        pageNumber: number;
        pagesCount: number;
        totalCount: number;
    };
};

export const useDeleteMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playlistId: string) => {
            const { data, error } = await client.DELETE('/playlists/{playlistId}', {
                params: { path: { playlistId } }
            });

            // 💡 1. КРИТИЧЕСКИ ВАЖНО: пробрасываем ошибку вручную,
            // чтобы TanStack Query перехватил 403/500 и вызвал onError!
            if (error) {
                throw error;
            }

            return data;
        },

        onMutate: async (playlistId: string) => {
            // Отменяем исходящие запросы
            await queryClient.cancelQueries({ queryKey: ['playlists'] });

            // 💡 2. Сохраняем снимок ВСЕХ списков плейлистов в памяти (getQueriesData во множественном числе)
            const previousPlaylists = queryClient.getQueriesData<PlaylistsResponse>({
                queryKey: ['playlists']
            });

            // Оптимистично вырезаем плейлист
            queryClient.setQueriesData<PlaylistsResponse>(
                { queryKey: ['playlists'] },
                (oldData) => {
                    if (!oldData?.data) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.filter((playlist) => playlist.id !== playlistId)
                    };
                }
            );

            return { previousPlaylists };
        },

        onError: (_err, _playlistId, context) => {
            // 💡 3. Откатываем КАЖДЫЙ сохраненный список из контекста обратно на свои места
            if (context?.previousPlaylists) {
                context.previousPlaylists.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        }
    });
};