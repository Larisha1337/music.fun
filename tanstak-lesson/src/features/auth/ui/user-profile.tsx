import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { useAvatarQuery } from "../../avatar/api/use-avatar-query.ts";
import { useUploadAvatarMutation } from "../../avatar/api/use-upload-avatar-mutation.ts";
import { useUpdateProfileMutation } from "@/features/auth/api/use-update-profile-mutation.ts";
import { LogoutButton } from "@/features/auth/ui/button/logout-button.tsx";
import { useGlow, glowShadow } from "@/shared/ui/lib/track-glow.ts";

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

const DEFAULT_RING = 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6, #818cf8)';

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

    // Цвет и состояние играющего трека (приходят из плеера)
    const glow = useGlow();

    // Бегущий блик по кольцу (Web Animations API: работает без CSS-файлов)
    useEffect(() => {
        const el = ringRef.current;
        if (!el || typeof el.animate !== 'function') return;

        const shine = el.animate(
            [{ backgroundPosition: '0% 50%' }, { backgroundPosition: '200% 50%' }],
            { duration: 2500, iterations: Infinity }
        );
        return () => shine.cancel();
    }, []);

    // Пульсация свечения, пока играет музыка
    useEffect(() => {
        const el = ringRef.current;
        if (!el || !glow.rgb || !glow.playing || typeof el.animate !== 'function') return;

        const pulse = el.animate(
            [{ boxShadow: glowShadow(glow.rgb, 'low') }, { boxShadow: glowShadow(glow.rgb, 'high') }],
            { duration: 1200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
        );
        return () => pulse.cancel();
    }, [glow.rgb, glow.playing]);

    const ringStyle: CSSProperties = {
        backgroundImage: glow.rgb
            ? `linear-gradient(90deg, rgb(${glow.rgb}), rgba(255,255,255,0.9), rgb(${glow.rgb}))`
            : DEFAULT_RING,
        backgroundSize: '200% 100%',
        boxShadow: glow.rgb ? glowShadow(glow.rgb, 'low') : '0 0 14px rgba(167,139,250,0.35)',
        transition: 'box-shadow 0.6s ease',
    };

    const pillStyle: CSSProperties | undefined = glow.rgb
        ? {
            borderColor: `rgba(${glow.rgb}, 0.4)`,
            boxShadow: `0 0 30px -8px rgba(${glow.rgb}, 0.65)`,
        }
        : undefined;

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

    return (
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {/* Стеклянная плашка профиля: всегда с именем, на узких экранах просто сжимается */}
            <div
                style={pillStyle}
                className="flex items-center gap-2 sm:gap-3 min-w-0 pl-1 sm:pl-1.5 pr-2 sm:pr-3.5 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all duration-700 hover:bg-white/[0.06]"
            >
                {/* Аватар: кольцо и свечение берут цвет играющего трека */}
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    title="Изменить аватар"
                    aria-label="Изменить аватар"
                    className="relative group shrink-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                    <span
                        ref={ringRef}
                        style={ringStyle}
                        className="block p-[2px] rounded-full transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
                    >
                        <span className="relative block w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-zinc-950">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl.startsWith('http') ? avatarUrl : `${MY_API_BASE}${avatarUrl}`}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 text-indigo-200 text-sm font-bold">
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

                    {/* Индикатор «онлайн» */}
                    <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </button>

                {/* Имя или поле ввода (показывается на любом экране) */}
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
                            className="w-20 sm:w-32 min-w-0 px-2 sm:px-2.5 py-1 text-xs bg-zinc-900/80 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={() => handleSaveName()}
                            disabled={isUpdatingName}
                            aria-label="Сохранить имя"
                            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-xs text-emerald-400 hover:bg-emerald-500/15 font-semibold cursor-pointer transition-colors disabled:opacity-50"
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
                                           bg-clip-text bg-[linear-gradient(90deg,#e4e4e7,#e4e4e7)] text-transparent transition-all duration-300
                                           group-hover/name:bg-[linear-gradient(90deg,#818cf8,#c084fc,#f472b6,#818cf8)]
                                           group-hover/name:bg-[length:200%_100%] group-hover/name:animate-nav-shine"
                            >
                                {displayName}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-zinc-500 group-hover/name:text-zinc-400 transition-colors">
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
                            className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 flex items-center justify-center rounded-md text-zinc-500 hover:text-indigo-300 hover:bg-white/10 transition-colors cursor-pointer"
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