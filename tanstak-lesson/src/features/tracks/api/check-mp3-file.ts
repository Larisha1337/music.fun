export const checkMp3File = (file: File): { isValid: boolean; error?: string } => {
    const isMp3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')
    if (!isMp3) {
        return { isValid: false, error: 'Файл должен быть в формате mp3' }
    }

    const maxSize = 20 * 1024 * 1024 // 20 MB
    if (file.size > maxSize) {
        return { isValid: false, error: 'Максимальный размер файла — 20 MB' }
    }

    return { isValid: true }
}