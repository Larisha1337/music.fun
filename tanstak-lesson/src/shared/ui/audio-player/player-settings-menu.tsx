import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EQ_BANDS, EQ_LIMIT, EQ_PRESETS, setEqBand, setEqPreset, useEq } from '@/shared/ui/lib/audio-engine.ts'

type Props = {
    rate: number
    onRate: (rate: number) => void
    sleepKind: 'off' | 'time' | 'track'
    sleepRemaining: number
    onSleepOff: () => void
    onSleepMinutes: (minutes: number) => void
    onSleepEndOfTrack: () => void
    onOpenQueue?: () => void
}

const RATES = [0.75, 1, 1.25, 1.5, 2]
const SLEEP_MINUTES = [15, 30, 60]

const formatRemaining = (total: number) => {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            active
                ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400/40'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
        }`}
    >
        {children}
    </button>
)

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">{title}</h4>
            {hint && <span className="text-[11px] font-mono text-indigo-300">{hint}</span>}
        </div>
        {children}
    </section>
)

export const PlayerSettingsMenu = ({
                                       rate,
                                       onRate,
                                       sleepKind,
                                       sleepRemaining,
                                       onSleepOff,
                                       onSleepMinutes,
                                       onSleepEndOfTrack,
                                       onOpenQueue,
                                   }: Props) => {
    const [open, setOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const eq = useEq()

    useEffect(() => {
        if (!open) return

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null
            if (!target) return
            if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
            setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    const hasActive = sleepKind !== 'off' || rate !== 1

    const sleepHint =
        sleepKind === 'time' ? `через ${formatRemaining(sleepRemaining)}` : sleepKind === 'track' ? 'после этого трека' : undefined

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Настройки плеера"
                title="Скорость, таймер сна, эквалайзер"
                className={`relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 ${
                    open ? 'bg-white/15 text-white' : 'text-zinc-300 hover:text-white hover:bg-white/15'
                }`}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h10m4 0h2M4 12h2m4 0h10M4 18h12m4 0h0M16 4v4M8 10v4m8 2v4" />
                </svg>
                {hasActive && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-zinc-900" />}
            </button>

            {open &&
                createPortal(
                    <div
                        ref={panelRef}
                        role="dialog"
                        aria-label="Настройки плеера"
                        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}
                        className="fixed right-3 sm:right-4 z-[10001] w-[min(21rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto custom-scrollbar flex flex-col gap-5 p-4 rounded-2xl bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl text-zinc-100"
                    >
                        {onOpenQueue && (
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false)
                                    onOpenQueue()
                                }}
                                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold cursor-pointer transition-colors"
                            >
                                <span>Очередь воспроизведения</span>
                                <span aria-hidden="true">›</span>
                            </button>
                        )}

                        <Section title="Скорость" hint={rate !== 1 ? `${rate}×` : undefined}>
                            <div className="flex flex-wrap gap-1.5">
                                {RATES.map((r) => (
                                    <Chip key={r} active={rate === r} onClick={() => onRate(r)}>
                                        {r}×
                                    </Chip>
                                ))}
                            </div>
                        </Section>

                        <Section title="Таймер сна" hint={sleepHint}>
                            <div className="flex flex-wrap gap-1.5">
                                <Chip active={sleepKind === 'off'} onClick={onSleepOff}>Выкл</Chip>
                                {SLEEP_MINUTES.map((m) => (
                                    <Chip key={m} active={false} onClick={() => onSleepMinutes(m)}>
                                        {m} мин
                                    </Chip>
                                ))}
                                <Chip active={sleepKind === 'track'} onClick={onSleepEndOfTrack}>До конца трека</Chip>
                            </div>
                        </Section>

                        <Section title="Эквалайзер">
                            <div className="flex flex-wrap gap-1.5">
                                {EQ_PRESETS.map((p) => (
                                    <Chip
                                        key={p.id}
                                        active={p.gains.every((g, i) => g === eq[i])}
                                        onClick={() => setEqPreset(p.gains)}
                                    >
                                        {p.label}
                                    </Chip>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1.5 mt-1">
                                {EQ_BANDS.map((band, i) => {
                                    const gain = eq[i] ?? 0
                                    return (
                                        <label key={band.freq} className="flex items-center gap-2 text-[11px] text-zinc-400">
                                            <span className="w-14 shrink-0 font-mono">{band.label}</span>
                                            <input
                                                type="range"
                                                min={-EQ_LIMIT}
                                                max={EQ_LIMIT}
                                                step={1}
                                                value={gain}
                                                onChange={(e) => setEqBand(i, Number(e.target.value))}
                                                onDoubleClick={() => setEqBand(i, 0)}
                                                aria-label={`Эквалайзер ${band.label}`}
                                                className="flex-1 min-w-0 accent-indigo-400 cursor-pointer"
                                            />
                                            <span className="w-9 shrink-0 text-right font-mono">
                                                {gain > 0 ? '+' : ''}
                                                {gain}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-zinc-500">Двойной клик по ползунку сбрасывает полосу</p>
                        </Section>
                    </div>,
                    document.body
                )}
        </>
    )
}