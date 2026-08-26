import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/api/client.ts";

export const useLogoutMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<unknown, Error, void>({
        mutationFn: async () => {
            const refreshToken = localStorage.getItem('musicfun-refresh-token');
            if (!refreshToken) return;

            const response = await client.POST('/auth/logout', {
                body: { refreshToken }
            });

            return response.data;
        },
        onSuccess: () => {
            localStorage.removeItem('musicfun-access-token');
            localStorage.removeItem('musicfun-refresh-token');

            queryClient.setQueryData(['me'], null);
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });
};