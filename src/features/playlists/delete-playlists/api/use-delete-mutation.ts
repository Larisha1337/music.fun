import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";

export const useDeletePlaylistMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playlistId: string) => {
            const response = await client.DELETE('/playlists/{playlistId}', {
                params: {
                    path: { playlistId }
                }
            });

            if (response.error) throw response.error;
            return response.data;
        },

        onMutate: async (playlistId) => {
            await queryClient.cancelQueries({ queryKey: playlistsKeys.all });

            const previousPlaylists = queryClient.getQueryData(playlistsKeys.all);

            const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
            const previousDescription = saved[playlistId];

            queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    data: oldData.data.filter((playlist: any) => playlist.id !== playlistId)
                };
            });

            delete saved[playlistId];
            localStorage.setItem('playlist_descriptions', JSON.stringify(saved));

            onSuccessCallback?.();

            return { previousPlaylists, previousDescription, playlistId };
        },

        onError: (err, _variables, context) => {
            if (context?.previousPlaylists) {
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, context.previousPlaylists);
            }

            if (context !== undefined && context.playlistId) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                if (context.previousDescription !== undefined) {
                    saved[context.playlistId] = context.previousDescription;
                    localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
                }
            }

            console.error("Ошибка удаления плейлиста", err);
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });
        }
    });
};