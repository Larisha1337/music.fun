// import { useState } from 'react'
// import { useUploadTrackMutation } from '../api/use-upload-track-mutation.ts'
//
// export const TrackUploadForm = () => {
//     const [title, setTitle] = useState('')
//     const [file, setFile] = useState<File | null>(null)
//     const mutation = useUploadTrackMutation()
//
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault()
//         if (!title || !file) return
//         mutation.mutate({ title, file })
//     }
//
//     return (
//         <form onSubmit={handleSubmit}>
//             <input
//                 type="text"
//                 placeholder="Название трека"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//             />
//             <input
//                 type="file"
//                 accept="audio/mpeg,.mp3"
//                 onChange={(e) => setFile(e.target.files?.[0] ?? null)}
//             />
//             <button type="submit" disabled={!title || !file || mutation.isPending}>
//                 {mutation.isPending ? 'Загрузка...' : 'Загрузить трек'}
//             </button>
//             {mutation.isError && <p>{mutation.error.message}</p>}
//         </form>
//     )
// }