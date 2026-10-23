import { isAxiosError } from 'axios'

/** Текст ошибки с сервера (поле message) или запасной вариант */
export const apiError = (e: unknown, fallback: string): string =>
    isAxiosError(e) ? ((e.response?.data as { message?: string } | undefined)?.message ?? fallback) : fallback