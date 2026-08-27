import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL = "https://musicfun.it-incubator.app/api/1.0";
const API_KEY = "a03aefd6-d7fb-49bc-96e8-93041c87a1a7";

export const client = createClient<paths>({
    baseUrl: API_BASE_URL,
    headers: {
        'api-key': API_KEY
    }
});

let refreshPromise: Promise<string | null> | null = null;

const refreshTokens = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('musicfun-refresh-token');
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
            localStorage.setItem('musicfun-access-token', data.accessToken);
            if (data.refreshToken) {
                localStorage.setItem('musicfun-refresh-token', data.refreshToken);
            }
            return data.accessToken;
        } else {
            localStorage.removeItem('musicfun-access-token');
            localStorage.removeItem('musicfun-refresh-token');
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
        const accessToken = localStorage.getItem('musicfun-access-token');
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