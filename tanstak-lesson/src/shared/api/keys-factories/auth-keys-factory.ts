export const authKeys = {
    // Базовый ключ для всего, что связано с плейлистами
    all: ['auth'] as const,

    // Ключ для списка (например, если появятся фильтры)
    me: () => [...authKeys.all, 'me'] as const,
};