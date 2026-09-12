import { useState } from 'react'

interface AvatarUploadProps {
    token: string
}

function AvatarUpload({ token }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile)) // локальное превью до отправки
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('avatar', file) // ключ 'avatar' совпадает с upload.single('avatar') на беке

        try {
            const response = await fetch('http://localhost:5000/api/user/avatar', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                    // Content-Type НЕ ставим вручную - браузер сам подставит
                    // правильный multipart/form-data с нужным boundary
                },
                body: formData
            })

            const data = await response.json()
            setSavedAvatarUrl(data.avatarUrl)
        } catch (error) {
            console.error('Ошибка загрузки:', error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            {preview && <img src={preview} alt="Превью (локально, ещё не сохранено)" width={100} />}
            {savedAvatarUrl && (
                <p>
                    ✓ Сохранено на сервере:{' '}
                    <img src={`http://localhost:5000${savedAvatarUrl}`} alt="Сохранённая аватарка" width={100} />
                </p>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Загрузка...' : 'Загрузить аватарку'}
            </button>
        </div>
    )
}

export default AvatarUpload