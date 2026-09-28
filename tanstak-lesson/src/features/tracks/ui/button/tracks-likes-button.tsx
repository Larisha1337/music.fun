import { useToggleLikeQuery, useMyPlaylistsQuery } from "@/features/playlists-new-my/api/use-playlists-query";

interface TrackLikeButtonProps {
    trackId: string;
}

export const TrackLikeButton = ({ trackId }: TrackLikeButtonProps) => {
    const { data: playlists = [] } = useMyPlaylistsQuery();
    const { mutate: toggleLike, isPending } = useToggleLikeQuery();

    // Находим системный плейлист "Мне нравится"
    const likedPlaylist = playlists.find((p: any) => p.name === "Мне нравится");

    // Проверяем, лайкнут ли трек
    const isLiked = likedPlaylist?.tracks?.some((t: any) =>
        typeof t === "string" ? t === trackId : t._id === trackId
    );

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={(e) => {
                e.stopPropagation(); // Чтобы трек не включался при клике на сердечко
                toggleLike(trackId);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                isLiked
                    ? "text-purple-400 bg-purple-500/15 hover:bg-purple-500/25" // 👈 Фиолетовый стиль при лайке
                    : "text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700"  // Обычный стиль
            }`}
            title={isLiked ? "Убрать из любимых" : "В любимые"}
        >
            <svg
                className={`w-5 h-5 transition-transform active:scale-90 ${isLiked ? "fill-current" : "fill-none stroke-current"}`}
                viewBox="0 0 24 24"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
};