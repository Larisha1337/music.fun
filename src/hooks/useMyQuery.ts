// src/hooks/useMeQuery.ts
import { useQuery } from "@tanstack/react-query";
import { client } from "../shared/api/client.ts";

export const useMeQuery = () => {

    return useQuery({
        queryKey: ['me'],
        queryFn: async ({ signal }) => {
            const accessToken = localStorage.getItem('musicfun-access-token');
            // Если токена нет вообще, даже не делаем запрос
            if (!accessToken) return null;

            const response = await client.GET('/auth/me', { signal });
            if (response.error) throw response.error;
            return response.data;
        },
        // Не перезапрашивать профиль автоматически при фокусе окна
        staleTime: Infinity,
        retry: false,
    });
};