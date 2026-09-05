import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";

export type CreatePlaylistFormValues = {
    title: string;
    description: string;
};

export const useCreatePlaylistMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: CreatePlaylistFormValues) => {
            const response = await client.POST('/playlists', {
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

        onMutate: async (formData) => {
            await queryClient.cancelQueries({ queryKey: playlistsKeys.all });
            const previousPlaylists = queryClient.getQueryData(playlistsKeys.all);

            const tempId = `temp-${Date.now()}`;
            const newPlaylist = {
                id: tempId,
                type: 'playlists',
                attributes: {
                    title: formData.title,
                    description: formData.description || null,
                }
            };

            queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                if (!oldData) return oldData;

                if (Array.isArray(oldData)) {
                    return [newPlaylist, ...oldData];
                }

                if (oldData.data && Array.isArray(oldData.data)) {
                    return {
                        ...oldData,
                        data: [newPlaylist, ...oldData.data]
                    };
                }

                return oldData;
            });

            if (formData.description) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                saved[tempId] = formData.description;
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }

            return { previousPlaylists, tempId };
        },

        onError: (err, _variables, context) => {
            if (context?.previousPlaylists) {
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, context.previousPlaylists);
            }
            if (context?.tempId) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                delete saved[context.tempId];
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }
            console.error("Ошибка создания плейлиста", err);
        },

        onSuccess: (data: any, _variables, context) => {
            const realId = data?.data?.id || data?.id;
            const tempId = context?.tempId;

            if (realId && tempId) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                if (saved[tempId]) {
                    saved[realId] = saved[tempId];
                    delete saved[tempId];
                    localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
                }

                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                    if (!oldData) return oldData;

                    const updateList = (list: any[]) =>
                        list.map(item => item?.id === tempId ? { ...item, id: realId } : item);

                    if (Array.isArray(oldData)) {
                        return updateList(oldData);
                    }
                    if (oldData.data && Array.isArray(oldData.data)) {
                        return {
                            ...oldData,
                            data: updateList(oldData.data)
                        };
                    }
                    return oldData;
                });
            }

            // Вызываем колбэк (например, для очистки формы)
            onSuccessCallback?.();
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });
        }
    });
};