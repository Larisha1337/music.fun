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
            const response = await client.DELETE('/playlists/{playlistId}', {
                params: { path: { playlistId } }
            });
            return response.data;
        },

        // Срабатывает МГНОВЕННО при вызове mutate()
        onMutate: async (playlistId: string) => {
            // 1. Отменяем исходящие запросы, чтобы они не перезаписали наш оптимистичный стейт
            await queryClient.cancelQueries({ queryKey: ['playlists'] });

            // 2. Сохраняем предыдущее состояние кэша на случай отката при ошибке
            const previousPlaylists = queryClient.getQueryData(['playlists']);

            // 3. Мгновенно удаляем элемент из UI
            queryClient.setQueriesData<PlaylistsResponse>(
                { queryKey: ['playlists'] },
                (oldData) => { // TS теперь сам знает, что oldData имеет тип PlaylistsResponse | undefined
                    if (!oldData?.data) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.filter((playlist) => playlist.id !== playlistId)
                    };
                }
            );

            // 4. Возвращаем контекст с предыдущими данными
            return { previousPlaylists };
        },

        // Если бэк вернул ошибку (например, 500 или нет прав) — откатываем UI назад
        onError: (_err: Error, _playlistId: string, context) => {
            if (context?.previousPlaylists) {
                queryClient.setQueryData(['playlists'], context.previousPlaylists);
            }
        }
    });
};