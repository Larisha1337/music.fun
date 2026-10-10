import { useRef } from "react";
import { useToggleLikeQuery, useMyPlaylistsQuery } from "@/features/playlists-new-my/api/use-playlists-query";

interface TrackLikeButtonProps {
    trackId: string;
}

const PETAL_SVG =
    '<svg viewBox="-11 -28 22 28" width="100%" height="100%" preserveAspectRatio="xMidYMax meet"><path d="M0 0 C-9 -6 -11 -20 -5 -26 C-3 -28 -1 -27 0 -24 C1 -27 3 -28 5 -26 C11 -20 9 -6 0 0 Z" fill="#ffb7d9"/></svg>';

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const TrackLikeButton = ({ trackId }: TrackLikeButtonProps) => {
    const { data: playlists = [] } = useMyPlaylistsQuery();
    const { mutate: toggleLike, isPending } = useToggleLikeQuery();

    const layerRef = useRef<HTMLSpanElement>(null);
    const heartRef = useRef<SVGSVGElement>(null);

    // Находим системный плейлист "Мне нравится"
    const likedPlaylist = playlists.find((p: any) => p.name === "Мне нравится");

    // Проверяем, лайкнут ли трек
    const isLiked = likedPlaylist?.tracks?.some((t: any) =>
        typeof t === "string" ? t === trackId : t._id === trackId
    );

    // Сердце хлопает, лепестки разлетаются
    const bloom = () => {
        if (reducedMotion()) return;

        heartRef.current?.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }],
            { duration: 380, easing: "cubic-bezier(0.3, 1.6, 0.5, 1)" }
        );

        const layer = layerRef.current;
        if (!layer) return;

        const count = 8;
        for (let i = 0; i < count; i++) {
            const el = document.createElement("span");
            el.setAttribute("aria-hidden", "true");
            el.style.cssText =
                "position:absolute;left:50%;top:50%;width:9px;height:12px;margin:-6px 0 0 -4.5px;pointer-events:none;";
            el.innerHTML = PETAL_SVG;
            layer.appendChild(el);

            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            const dist = 20 + Math.random() * 16;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist - 4;
            const spin = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 160);

            const anim = el.animate(
                [
                    { transform: "translate(0, 0) rotate(0deg) scale(0.4)", opacity: 1 },
                    { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(1)`, opacity: 0 },
                ],
                { duration: 650 + Math.random() * 250, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
            );
            anim.onfinish = () => el.remove();
            anim.oncancel = () => el.remove();
        }
    };

    return (
        <button
            type="button"
            disabled={isPending}
            data-on={isLiked ? "true" : "false"}
            aria-pressed={Boolean(isLiked)}
            onClick={(e) => {
                e.stopPropagation(); // Чтобы трек не включался при клике на сердечко
                if (!isLiked) bloom();
                toggleLike(trackId);
            }}
            className="icon-btn grid"
            title={isLiked ? "Убрать из любимых" : "В любимые"}
        >
            <svg
                ref={heartRef}
                className={`w-5 h-5 ${isLiked ? "fill-current" : "fill-none stroke-current"}`}
                viewBox="0 0 24 24"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>

            <span ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
        </button>
    );
};