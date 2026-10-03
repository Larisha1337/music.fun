interface TrackSearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export const TrackSearch = ({
                                value,
                                onChange,
                                placeholder = 'Поиск по названию или исполнителю...'
                            }: TrackSearchProps) => {
    return (
        <div className="relative max-w-4xl mx-auto w-full mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                🔍
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-11 pr-4 py-3 bg-zinc-950/60 backdrop-blur-xl border border-zinc-900 focus:border-indigo-500/50 rounded-2xl text-zinc-100 placeholder-zinc-500 text-sm sm:text-base outline-none transition-all shadow-lg focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    ✕
                </button>
            )}
        </div>
    )
}