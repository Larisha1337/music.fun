const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000'

/** Абсолютный адрес картинки: ссылки на R2 остаются как есть, старые пути /uploads/... достраиваются */
export const mediaUrl = (url?: string | null): string | null =>
    url ? (url.startsWith('http') ? url : `${MY_API_BASE}${url}`) : null