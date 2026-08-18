import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../shared/api/client.ts';

// 💡 Типизируем входящие параметры вместо хардкода
type CreatePlaylistPayload = {
    title: string;
    description?: string;
};

export const useAddPlaylistMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ title, description }: CreatePlaylistPayload) => {
            const { data, error } = await client.POST('/playlists', {
                body: {
                    data: {
                        type: 'playlists',
                        attributes: {
                            title,
                            description: description ?? null,
                        },
                    },
                },
            });

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
        },
    });
};