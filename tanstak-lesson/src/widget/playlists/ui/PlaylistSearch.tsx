
interface PlaylistSearchProps {
    search: string;
    onSearchChange: (value: string) => void;
}

export const PlaylistSearch = ({ search, onSearchChange }: PlaylistSearchProps) => {
    return (
        <div className="space-y-4">
            <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск плейлистов..."
                className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all text-sm sm:text-base shadow-sm"
            />
        </div>
    );
};