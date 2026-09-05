import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";
import type { FormValues } from "../ui/form/type/edit-type.ts";

export const useEditPlaylistMutation = (playlistId: string, onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormValues) => {
            const response = await client.PUT('/playlists/{playlistId}', {
                params: {
                    path: { playlistId }
                },
                body: {
                    data: {
                        type: 'playlists',
                        attributes: {
                            title: formData.title,
                            description: formData.description || null,
                            tagIds: []
                        }
                    }
                }
            });

            if (response.error) throw response.error;
            return response.data;
        },

        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: playlistsKeys.all });

            // 💡 Исправили хардкод ключа на использование фабрики
            const previousPlaylists = queryClient.getQueryData(playlistsKeys.all);

            const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
            const previousDescription = saved[playlistId];

            queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    data: oldData.data.map((playlist: any) =>
                        playlist.id === playlistId
                            ? {
                                ...playlist,
                                attributes: {
                                    ...playlist.attributes,
                                    title: variables.title,
                                    description: variables.description
                                }
                            }
                            : playlist
                    )
                };
            });

            saved[playlistId] = variables.description;
            localStorage.setItem('playlist_descriptions', JSON.stringify(saved));

            onSuccessCallback?.();

            return { previousPlaylists, previousDescription };
        },

        onError: (err, _variables, context) => {
            if (context?.previousPlaylists) {
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, context.previousPlaylists);
            }

            if (context !== undefined) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                if (context.previousDescription) {
                    saved[playlistId] = context.previousDescription;
                } else {
                    delete saved[playlistId];
                }
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }

            console.error("Ошибка обновления плейлиста", err);
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });
        }
    });
};