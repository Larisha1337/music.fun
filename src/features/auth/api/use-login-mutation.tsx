import { useMutation, useQueryClient } from "@tanstack/react-query";
import {client} from "../../../shared/api/client.ts";

export const callbackUrl = 'http://localhost:5173/oauth/callback';

export const useLoginMutation = () => {
    const queryClient = useQueryClient();


    const mutation = useMutation({
        mutationFn: async ({ code }: { code: string }) => {
            const response = await client.POST('/auth/login', {
                body: {
                    code,
                    redirectUri: callbackUrl,
                    rememberMe: true,
                    accessTokenTTL: '10s'
                }
            });
            if (response.error) throw response.error;
            return response.data;
        },
        onSuccess: (data) => {
            localStorage.setItem('musicfun-refresh-token', data.refreshToken);
            localStorage.setItem('musicfun-access-token', data.accessToken);

            // 💡 Инвалидируем 'me', чтобы приложение перерисовало авторизованное состояние
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });



    return mutation
};