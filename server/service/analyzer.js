import axios from 'axios'

const ANALYZER_URL = process.env.ANALYZER_URL || 'http://127.0.0.1:8000'

/** Отправляет аудио по ссылке в Python-сервис. Возвращает { bpm, key, peaks } или null при ошибке */
export const analyzeAudioUrl = async (url) => {
    try {
        const { data } = await axios.post(`${ANALYZER_URL}/analyze`, { url }, { timeout: 120000 })
        return {
            bpm: Number.isFinite(data?.bpm) ? data.bpm : null,
            key: data?.key || null,
            peaks: Array.isArray(data?.peaks) ? data.peaks : null,
        }
    } catch (error) {
        console.error('[Analyzer] Ошибка:', error.response?.data?.detail || error.response?.data || error.message)
        return null
    }
}