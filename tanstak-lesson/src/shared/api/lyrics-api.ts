export const fetchLyrics = async (trackTitle: string, artistName?: string): Promise<string | null> => {
    try {
        const queryParams = new URLSearchParams({
            track_name: trackTitle,
        })

        if (artistName && artistName !== 'Неизвестный исполнитель') {
            queryParams.append('artist_name', artistName)
        }

        const response = await fetch(`https://lrclib.net/api/get?${queryParams.toString()}`)
        if (!response.ok) return null

        const data = await response.json()
        return data.syncedLyrics || data.plainLyrics || null
    } catch (error) {
        console.error('[Lyrics API Error]:', error)
        return null
    }
}