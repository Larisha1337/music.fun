import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

export const client = createClient<paths>({baseUrl: "https://musicfun.it-incubator.app/api/1.0",
    headers: {
        'api-key': 'a03aefd6-d7fb-49bc-96e8-93041c87a1a7'
    }});



// export const client = createClient<paths>({
//     baseUrl: "https://musicfun.it-incubator.app/api/1.0"
// });

const authMiddleware: Middleware = {
    async onRequest({ request }) {
        // 1. Подставляем Access Token перед каждым запросом
        const accessToken = localStorage.getItem('musicfun-access-token');
        if (accessToken) {
            request.headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return request;
    },

    async onResponse({ response, request }) {
        // 2. Если получаем 401 (токен протух)
        if (response.status === 401) {
            const refreshToken = localStorage.getItem('musicfun-refresh-token');
            if (!refreshToken) return response;

            try {
                // Запрашиваем новую пару токенов (укажи свой роут рефреша)
                const refreshResponse = await fetch('https://musicfun.it-incubator.app/api/1.0/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();

                    // Сохраняем новые токены
                    localStorage.setItem('musicfun-access-token', data.accessToken);
                    localStorage.setItem('musicfun-refresh-token', data.refreshToken);

                    // Повторяем изначальный запрос с новым токеном
                    request.headers.set("Authorization", `Bearer ${data.accessToken}`);
                    return fetch(request);
                } else {
                    // Если рефреш протух — разлогиниваем
                    localStorage.removeItem('musicfun-access-token');
                    localStorage.removeItem('musicfun-refresh-token');
                }
            } catch (e) {
                console.error('Ошибка обновления токена', e);
            }
        }
        return response;
    }
};

client.use(authMiddleware);