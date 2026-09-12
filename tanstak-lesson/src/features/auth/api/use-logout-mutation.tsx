import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/api/client.ts";
import {authKeys} from "../../../shared/api/keys-factories/auth-keys-factory.ts";
import {localStorageKey} from "../../../shared/config/local-storage-key.ts";
import {avatarKeys} from "../../../api/use-avatar-query.ts";

export const useLogoutMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<unknown, Error, void>({
        mutationFn: async () => {
            const refreshToken = localStorage.getItem(localStorageKey.refreshToken);
            if (!refreshToken) return;

            const response = await client.POST('/auth/logout', {
                body: { refreshToken }
            });

            return response.data;
        },
        onSuccess: () => {
            localStorage.removeItem(localStorageKey.accessToken);
            localStorage.removeItem(localStorageKey.refreshToken);

            queryClient.setQueryData(['me'], null);
            queryClient.invalidateQueries({ queryKey: authKeys.me() });
            queryClient.removeQueries({ queryKey: avatarKeys.avatar });
        }
    });
};