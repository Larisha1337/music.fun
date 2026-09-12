import { useUploadAvatarMutation } from "../api/use-upload-avatar-mutation.ts"

export const AvatarUploadButton = () => {
    const mutation = useUploadAvatarMutation()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) mutation.mutate(file)
    }

    return (
        <label style={{ cursor: 'pointer' }}>
            <input type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
            <span>{mutation.isPending ? 'Загрузка...' : 'Сменить аватарку'}</span>
        </label>
    )
}