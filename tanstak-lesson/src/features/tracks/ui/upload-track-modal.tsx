import { useState, useRef } from 'react'
import { UploadTrackForm } from './upload-track-form.tsx'
import { useUploadTrackMutation, type UploadTrackFormValues } from '../api/use-upload-track-mutation.ts'

export const UploadTrackModal = () => {
    const [isOpen, setIsOpen] = useState(false)
    const isSubmittingRef = useRef(false)

    const { mutate, isPending, reset } = useUploadTrackMutation(() => {
        setIsOpen(false)
        isSubmittingRef.current = false
    })

    const handleFormSubmit = (formData: UploadTrackFormValues) => {
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        mutate(formData, {
            onError: () => {
                isSubmittingRef.current = false
            }
        })
    }

    const handleClose = () => {
        setIsOpen(false)
        isSubmittingRef.current = false
        reset()
    }

    const handleOpen = () => {
        reset()
        setIsOpen(true)
    }

    return (
        <>
            <button
                onClick={handleOpen}
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white font-semibold text-sm sm:text-base rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/40 cursor-pointer overflow-hidden border border-indigo-400/20"
            >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 group-hover:rotate-90 transition-transform duration-300">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
                <span>Upload Track</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <UploadTrackForm
                        onSubmit={handleFormSubmit}
                        onCancel={handleClose}
                        isPending={isPending}
                    />
                </div>
            )}
        </>
    )
}