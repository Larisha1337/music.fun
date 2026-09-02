export const playlistsKeys = {
    // Базовый ключ для всего, что связано с плейлистами
    all: ['playlists'] as const,

    // Ключ для списка (например, если появятся фильтры)
    lists: () => [...playlistsKeys.all, 'lists'] as const,
     myList: () => [...playlistsKeys.lists(), 'my'] as const,
      list: (filters: Record<string, any>) => [...playlistsKeys.lists(), { filters }] as const,

    // Ключи для конкретного плейлиста
    details: () => [...playlistsKeys.all, 'detail'] as const,
     detail: (id: string) => [...playlistsKeys.details(), id] as const,
};