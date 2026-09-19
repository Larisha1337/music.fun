import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";

export const useDeletePlaylistCoverMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playlistId: string) => {
            const response = await client.DELETE('/playlists/{playlistId}/images/main', {
                params: { path: { playlistId } }
            });

            if (response.error) {
                const apiError = response.error as any;
                const message = apiError?.errors?.[0]?.detail || apiError?.title || "Не удалось удалить обложку";
                throw new Error(message);
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: playlistsKeys.all, refetchType: "all" });
            onSuccessCallback?.();
        }
    });
};