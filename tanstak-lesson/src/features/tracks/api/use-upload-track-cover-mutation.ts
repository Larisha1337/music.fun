import { useMutation } from '@tanstack/react-query'
import { localStorageKey } from '../../../shared/config/local-storage-key.ts'

const API_BASE = 'https://musicfun.it-incubator.app/api/1.0'

export const useUploadTrackCoverMutation = () => {
    return useMutation({
        mutationFn: async ({ trackId, cover }: { trackId: string; cover: File }) => {
            const token = localStorage.getItem(localStorageKey.accessToken)

            const body = new FormData()
            body.append('cover', cover)

            const response = await fetch(`${API_BASE}/playlists/tracks/${trackId}/cover`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body
            })

            if (!response.ok) {
                const errorData = await response.json()
                const message = errorData?.errors?.[0]?.detail ?? errorData?.title ?? 'Не удалось загрузить обложку трека'
                throw new Error(message)
            }

            return response.json()
        }
    })
}