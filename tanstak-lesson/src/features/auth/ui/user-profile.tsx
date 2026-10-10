import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { useAvatarQuery } from "../../avatar/api/use-avatar-query.ts";
import { useUploadAvatarMutation } from "../../avatar/api/use-upload-avatar-mutation.ts";
import { useUpdateProfileMutation } from "@/features/auth/api/use-update-profile-mutation.ts";
import { LogoutButton } from "@/features/auth/ui/button/logout-button.tsx";
import { useGlow, subscribeBeat } from "@/shared/ui/lib/track-glow.ts";

type Props = {
    user: {
        email?: string;
        name?: string;
        username?: string;
    };
};

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000';

const CameraIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 112.828 2.828L11.828 15.83a2 2 0 01-.89.52L7 17l.65-3.94a2 2 0 01.52-.89z" />
    </svg>
);

/* Иконка отдельного лепестка сакуры для анимации */
const SakuraPetal = ({ className, style }: { className?: string, style?: CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 50 62" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 0C25.9676 2.1466 27.2763 3.99281 28.7188 5.67204C33.8821 11.6917 40.5898 15.6881 46.107 22.0645C51.2704 28.0842 51.1091 36.3155 46.2683 41.6917C41.4275 47.068 31.8687 48.7473 25 48.7473C18.1313 48.7473 8.57248 47.068 3.73166 41.6917C-1.10915 36.3155 -1.27043 28.0842 3.89299 22.0645C9.41018 15.6881 16.1179 11.6917 21.2812 5.67204C22.7237 3.99281 24.0324 2.1466 25 0Z" fill="currentColor" />
    </svg>
);

/* Фиксированный сакуровый градиент для кольца и RGB для мягкого свечения */
const SAKURA_RING = 'linear-gradient(90deg, #ffe0f1, #ffb7d5, #f95c9e, #ffe0f1)';
const SAKURA_RGB = '249, 92, 158'; // Брендовый розовый

export const UserProfile = ({ user }: Props) => {
    const displayName = user.name || user.username || user.email || "User";
    const initial = String(displayName).charAt(0).toUpperCase();

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(displayName);

    const { data: avatarUrl } = useAvatarQuery();
    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatarMutation();
    const { mutate: updateProfile, isPending: isUpdatingName } = useUpdateProfileMutation();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const ringRef = useRef<HTMLSpanElement>(null);

    const glow = useGlow();

    // Бегущий мягкий блик по сакуровому кольцу (Web Animations API)
    useEffect(() => {
        const el = ringRef.current;
        if (!el || typeof el.animate !== 'function') return;

        const shine = el.animate(
            [{ backgroundPosition: '0% 50%' }, { backgroundPosition: '200% 50%' }],
            { duration: 3500, iterations: Infinity, easing: 'linear' }
        );
        return () => shine.cancel();
    }, []);

    // Нежный сакуровый ореол вокруг аватара и плашки
    const ringStyle: CSSProperties = {
        backgroundImage: SAKURA_RING,
        backgroundSize: '200% 100%',
        boxShadow: glow.playing
            ? `0 0 25px 4px rgba(${SAKURA_RGB}, 0.55)`
            : `0 0 14px 2px rgba(255, 183, 213, 0.25)`,
        transition: 'box-shadow 0.6s ease-in-out',
    };

    const pillStyle: CSSProperties = {
        borderColor: `rgba(${SAKURA_RGB}, 0.25)`,
        boxShadow: glow.playing
            ? `0 0 35px -8px rgba(${SAKURA_RGB}, 0.45)`
            : `0 0 20px -8px rgba(${SAKURA_RGB}, 0.15)`,
        transition: 'all 0.6s ease-in-out',
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadAvatar(file);
        e.target.value = "";
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleSaveName = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = nameInput.trim();
        if (!trimmed || trimmed === displayName) {
            setIsEditingName(false);
            return;
        }

        updateProfile(
            { name: trimmed },
            { onSuccess: () => setIsEditingName(false) }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSaveName();
        if (e.key === "Escape") {
            setNameInput(displayName);
            setIsEditingName(false);
        }
    };

    // Параметры для парящих лепестков вокруг аватара
    const petals = [
        { size: 'w-2.5 h-3', pos: 'top-[-8px] left-[-8px]', delay: '0s' },
        { size: 'w-2 h-2.5', pos: 'top-[-10px] right-[-2px]', delay: '1s' },
        { size: 'w-3 h-3.5', pos: 'bottom-[-6px] left-[-2px]', delay: '2s' },
        { size: 'w-2 h-2.5', pos: 'bottom-[-4px] right-[-8px]', delay: '3s' },
    ];

    return (
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {/* Стеклянная плашка профиля с сакуровым обрамлением */}
            <div
                style={pillStyle}
                className="group flex items-center gap-2 sm:gap-3 min-w-0 pl-1 sm:pl-1.5 pr-2 sm:pr-3.5 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border backdrop-blur-md transition-all duration-700 hover:bg-white/[0.07]"
            >
                {/* Узор из лепестков сакуры внутри фона плашки */}
                <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden opacity-5" aria-hidden="true">
                    {[...Array(6)].map((_, i) => (
                        <SakuraPetal
                            key={i}
                            className="absolute text-pink-300"
                            style={{
                                width: `${Math.random() * 8 + 8}px`,
                                top: `${Math.random() * 80 + 10}%`,
                                left: `${Math.random() * 80 + 10}%`,
                                transform: `rotate(${Math.random() * 360}deg)`,
                            }}
                        />
                    ))}
                </span>

                {/* Аватар в сакуровом кольце с парящими лепестками */}
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    title="Изменить аватар"
                    aria-label="Изменить аватар"
                    className="relative shrink-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                >
                    {/* Парящие, пульсирующие лепестки вокруг аватара (ФОРМА, НЕ ЦВЕТ) */}
                    {petals.map((petal, i) => (
                        <SakuraPetal
                            key={i}
                            className={`pointer-events-none absolute text-pink-300/60 ${petal.size} ${petal.pos} 
                                       animate-sakura-pulse transition-shadow duration-300
                                       ${glow.playing ? 'animate-sakura-pulse-fast' : ''}`}
                            style={{ animationDelay: petal.delay }}
                        />
                    ))}

                    <span
                        ref={ringRef}
                        style={ringStyle}
                        className="relative block p-[2px] rounded-full transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
                    >
                        <span className="relative block w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-zinc-950">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl.startsWith('http') ? avatarUrl : `${MY_API_BASE}${avatarUrl}`}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/30 to-fuchsia-500/20 text-pink-200 text-sm font-bold">
                                    {initial}
                                </span>
                            )}

                            <span
                                className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
                                    isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                            >
                                {isUploadingAvatar ? (
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <CameraIcon className="w-4 h-4 text-white" />
                                )}
                            </span>
                        </span>
                    </span>

                    {/* Точка «онлайн» в брендовом розовом Anivox */}
                    <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-pink-500 ring-2 ring-zinc-950 shadow-[0_0_8px_rgba(249,92,158,0.9)]" />
                </button>

                {/* Имя профиля */}
                {isEditingName ? (
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isUpdatingName}
                            maxLength={32}
                            className="w-20 sm:w-32 min-w-0 px-2 sm:px-2.5 py-1 text-xs bg-zinc-900/80 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30 disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={() => handleSaveName()}
                            disabled={isUpdatingName}
                            aria-label="Сохранить имя"
                            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-xs text-pink-300 hover:bg-pink-500/15 font-semibold cursor-pointer transition-colors disabled:opacity-50"
                        >
                            ✓
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setNameInput(displayName);
                                setIsEditingName(false);
                            }}
                            aria-label="Отменить"
                            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-xs text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <Link
                            to="/my-tracks"
                            activeOptions={{ exact: true }}
                            title="Мои треки"
                            className="group/name flex flex-col min-w-0 leading-tight"
                        >
                            <span
                                className="font-semibold text-xs sm:text-sm tracking-wide truncate
                                           max-w-[64px] min-[400px]:max-w-[90px] sm:max-w-[120px] lg:max-w-[160px]
                                           text-zinc-200 transition-all duration-300
                                           group-hover/name:text-pink-300"
                            >
                                {displayName}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-zinc-400 group-hover/name:text-pink-300/80 transition-colors">
                                Мои треки
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setNameInput(displayName);
                                setIsEditingName(true);
                            }}
                            title="Изменить имя"
                            aria-label="Изменить имя"
                            className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:text-pink-300 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <PencilIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <LogoutButton />
        </div>
    );
};