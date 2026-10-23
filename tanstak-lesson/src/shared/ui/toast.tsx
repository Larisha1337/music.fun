import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

type Kind = 'success' | 'error' | 'info'
type Action = { label: string; onClick: () => void }
type Item = { id: number; kind: Kind; message: string; action?: Action }
type Options = { action?: Action; duration?: number }

let items: Item[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const dismiss = (id: number) => {
    items = items.filter((t) => t.id !== id)
    emit()
}

const push = (kind: Kind, message: string, options?: Options) => {
    const id = nextId++
    items = [...items.slice(-2), { id, kind, message, action: options?.action }] // не больше трёх сразу
    emit()
    window.setTimeout(() => dismiss(id), options?.duration ?? (options?.action ? 6500 : 3200))
    return id
}

export const toast = {
    success: (message: string, options?: Options) => push('success', message, options),
    error: (message: string, options?: Options) => push('error', message, options),
    info: (message: string, options?: Options) => push('info', message, options),
    dismiss,
}

const subscribe = (cb: () => void) => {
    listeners.add(cb)
    return () => {
        listeners.delete(cb)
    }
}

const DOT: Record<Kind, string> = {
    success: 'bg-pink-300',
    error: 'bg-rose-400',
    info: 'bg-zinc-400',
}

/** Монтируется один раз (в шапке) */
export const Toaster = () => {
    const list = useSyncExternalStore(subscribe, () => items)
    if (list.length === 0) return null

    return createPortal(
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 z-[10010] flex flex-col items-center gap-2 px-3"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.25rem)' }}
        >
            {list.map((t) => (
                <div
                    key={t.id}
                    className="animate-pop-in pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-pink-200/15 bg-zinc-900/95 py-2.5 pl-4 pr-2.5 text-sm font-medium text-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[t.kind]}`} />
                    <span className="min-w-0 break-words">{t.message}</span>

                    {t.action && (
                        <button
                            type="button"
                            onClick={() => {
                                t.action?.onClick()
                                dismiss(t.id)
                            }}
                            className="shrink-0 cursor-pointer rounded-full bg-pink-300 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-zinc-950 transition-colors hover:bg-pink-200"
                        >
                            {t.action.label}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => dismiss(t.id)}
                        aria-label="Закрыть"
                        className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>,
        document.body
    )
}