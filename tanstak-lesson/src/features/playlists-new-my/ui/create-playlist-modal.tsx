import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/shared/ui/modal/remove-modal.tsx'
import { toast } from '@/shared/ui/toast.tsx'
import { apiError } from '@/shared/ui/lib/api-error.ts'
import { useCreatePlaylistMutation, type Playlist } from '../api/use-playlists-query.ts'

const MAX_COVER = 5 * 1024 * 1024

type Props = {
    isOpen: boolean
    onClose: () => void
    onCreated?: (playlist: Playlist) => void
}

export const CreatePlaylistModal = ({ isOpen, onClose, onCreated }: Props) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const urlRef = useRef<string | null>(null)

    const { mutate, isPending } = useCreatePlaylistMutation()

    const dropPreview = () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
    }

    useEffect(() => {
        if (isOpen) {
            setName('')
            setDescription('')
            setCoverFile(null)
            setCoverPreview(null)
            dropPreview()
        }
    }, [isOpen])

    useEffect(() => dropPreview, [])

    const pickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        if (!file.type.startsWith('image/')) return void toast.error('Нужна картинка')
        if (file.size > MAX_COVER) return void toast.error('Обложка не больше 5 МБ')

        dropPreview()
        urlRef.current = URL.createObjectURL(file)
        setCoverFile(file)
        setCoverPreview(urlRef.current)
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed || isPending) return

        const fd = new FormData()
        fd.append('name', trimmed)
        if (description.trim()) fd.append('description', description.trim())
        if (coverFile) fd.append('cover', coverFile)

        mutate(fd, {
            onSuccess: (playlist) => {
                toast.success(`Плейлист «${playlist.name}» создан`)
                onCreated?.(playlist)
                onClose()
            },
            onError: (err) => toast.error(apiError(err, 'Не удалось создать плейлист')),
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Новый плейлист" maxWidth="max-w-md">
            <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                    <label className="group relative grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-pink-200/30 bg-white/[0.04] transition-colors hover:border-pink-300/70">
                        <input type="file" accept="image/*" onChange={pickCover} className="hidden" />
                        {coverPreview ? (
                            <img src={coverPreview} alt="Предпросмотр обложки" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex flex-col items-center gap-1 text-zinc-400 transition-colors group-hover:text-pink-200">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 4 4 4-5 4 5M4 5h16v14H4z" />
                                </svg>
                                <span className="text-[11px] font-semibold">Обложка</span>
                            </span>
                        )}
                    </label>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <label htmlFor="pl-name" className="text-xs font-semibold text-zinc-400">
                            Название *
                        </label>
                        <input
                            id="pl-name"
                            type="text"
                            autoFocus
                            required
                            maxLength={100}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Мой плейлист"
                            disabled={isPending}
                            className="input-soft"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="pl-desc" className="text-xs font-semibold text-zinc-400">
                        Описание
                    </label>
                    <textarea
                        id="pl-desc"
                        rows={2}
                        maxLength={200}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Необязательно"
                        disabled={isPending}
                        className="input-soft resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={isPending} className="btn-soft">
                        Отмена
                    </button>
                    <button type="submit" disabled={isPending || !name.trim()} className="btn-accent">
                        {isPending ? 'Создаём...' : 'Создать'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}