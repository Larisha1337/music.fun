import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import {localStorageKey} from "../config/local-storage-key.ts";

const API_BASE_URL=import.meta.env.VITE_API_BASE_URL
const API_KEY=import.meta.env.VITE_API_KEY

export const client = createClient<paths>({
    baseUrl: API_BASE_URL,
    headers: {
        'api-key': API_KEY
    }
});

let refreshPromise: Promise<string | null> | null = null;

const refreshTokens = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(localStorageKey.refreshToken);
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': API_KEY 
            },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem(localStorageKey.accessToken, data.accessToken);
            if (data.refreshToken) {
                localStorage.setItem(localStorageKey.refreshToken, data.refreshToken);
            }
            return data.accessToken;
        } else {
            localStorage.removeItem(localStorageKey.accessToken);
            localStorage.removeItem(localStorageKey.refreshToken);
            return null;
        }
    } catch (e) {
        console.error('Ошибка обновления токена', e);
        return null;
    } finally {
        refreshPromise = null;
    }
};

const authMiddleware: Middleware = {
    async onRequest({ request }) {
        const accessToken = localStorage.getItem(localStorageKey.accessToken);
        if (accessToken) {
            request.headers.set("Authorization", `Bearer ${accessToken}`);
        }

        // @ts-ignore
        request._retryRequest = request.clone();

        return request;
    },

    async onResponse({ response, request }) {

        if (response.status === 401) {
            if (!refreshPromise) {
                refreshPromise = refreshTokens();
            }

            const newAccessToken = await refreshPromise;

            if (newAccessToken) {
                // 💡 4. Берем сохраненный клон со «живым» body, а не сгоревший request
                // @ts-ignore
                const retryReq: Request = request._retryRequest || request;

                const newRequest = new Request(retryReq, {
                    headers: new Headers(retryReq.headers)
                });
                newRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

                return fetch(newRequest);
            }
        }
        return response;
    }
};

client.use(authMiddleware);