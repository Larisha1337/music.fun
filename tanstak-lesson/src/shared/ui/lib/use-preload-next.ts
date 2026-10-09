import { useEffect } from 'react'
import { api } from '@/shared/api/axiosInstance.ts'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

type Target = { id: string; src: string; streamed: boolean }

/**
 * Готовит следующий трек очереди заранее.
 * Для YouTube-треков просим сервер скачать звук в кэш, для файлов из R2 прогреваем загрузку в браузере.
 */
export const usePreloadNext = (target: Target | null) => {
    const id = target?.id
    const src = target?.src
    const streamed = target?.streamed

    useEffect(() => {
        if (!id || !src) return

        let audio: HTMLAudioElement | null = null

        // Ждём 4 секунды: пока пользователь не пролистал треки подряд
        const timer = window.setTimeout(() => {
            if (streamed) {
                if (localStorage.getItem(localStorageKey.accessToken)) {
                    api.post(`/tracks/${id}/prefetch`).catch(() => {})
                }
                return
            }

            audio = new Audio()
            audio.preload = 'auto'
            audio.crossOrigin = 'anonymous'
            audio.src = src
        }, 4000)

        return () => {
            window.clearTimeout(timer)
            if (audio) {
                audio.removeAttribute('src')
                audio.load()
                audio = null
            }
        }
    }, [id, src, streamed])
}