import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axiosInstance.ts'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'
import { useGlow } from '@/shared/ui/lib/track-glow.ts'

const COUNT_AFTER_SECONDS = 20

export const usePlayHistory = (trackId?: string) => {
    const { playing } = useGlow() // реальное состояние плеера
    const queryClient = useQueryClient()

    const secondsRef = useRef(0)
    const sentRef = useRef<string | null>(null)
    const lastIdRef = useRef<string | undefined>(undefined)

    // Новый трек: счётчик с нуля
    useEffect(() => {
        if (lastIdRef.current !== trackId) {
            lastIdRef.current = trackId
            secondsRef.current = 0
            sentRef.current = null
        }
    }, [trackId])

    useEffect(() => {
        if (!trackId || !playing) return
        if (!localStorage.getItem(localStorageKey.accessToken)) return

        const timer = window.setInterval(() => {
            secondsRef.current += 1

            if (secondsRef.current >= COUNT_AFTER_SECONDS && sentRef.current !== trackId) {
                sentRef.current = trackId
                api.post('/history/play', { trackId })
                    .then(() => queryClient.invalidateQueries({ queryKey: ['recent-tracks'] }))
                    .catch(() => {
                        sentRef.current = null
                    })
            }
        }, 1000)

        return () => window.clearInterval(timer)
    }, [trackId, playing, queryClient])
}