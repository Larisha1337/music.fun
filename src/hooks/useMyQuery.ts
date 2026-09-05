// src/hooks/useMeQuery.ts
import { useQuery } from "@tanstack/react-query";
import { client } from "../shared/api/client.ts";
import { authKeys } from "../shared/api/keys-factories/auth-keys-factory.ts"; // 💡 Импортируем фабрику

export const useMeQuery = () => {
    return useQuery({
        queryKey: authKeys.me(),
        queryFn: async ({ signal }) => {
            const accessToken = localStorage.getItem('musicfun-access-token');
            if (!accessToken) return null;

            const response = await client.GET('/auth/me', { signal });
            if (response.error) throw response.error;
            return response.data;
        },
        staleTime: Infinity,
        retry: false,
    });
};