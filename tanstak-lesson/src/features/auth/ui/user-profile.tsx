import { useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { useAvatarQuery } from "../../avatar/api/use-avatar-query.ts";
import { useUploadAvatarMutation } from "../../avatar/api/use-upload-avatar-mutation.ts";
import { useUpdateProfileMutation } from "@/features/auth/api/use-update-profile-mutation.ts";
import { LogoutButton } from "@/features/auth/ui/button/logout-button.tsx";
import { BloomPetals, useBloom } from "@/shared/ui/sakura-bloom.tsx";

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

// Рамка и свечение читают --bloom, который useBloom обновляет на плашке (без перерисовок React)
const pillStyle: CSSProperties = {
    borderColor: 'rgba(255, 159, 214, calc(0.12 + var(--bloom, 0.22) * 0.3))',
    boxShadow: '0 0 30px -10px rgba(249, 92, 158, calc(0.18 + var(--bloom, 0.22) * 0.5))',
};

const ringStyle: CSSProperties = {
    backgroundImage: 'conic-gradient(from 200deg, #ffe0f1, #ffb7d5, #f95c9e, #ffb7d5, #ffe0f1)',
    boxShadow: '0 0 calc(6px + var(--bloom, 0.22) * 14px) rgba(255, 159, 214, calc(0.25 + var(--bloom, 0.22) * 0.4))',
};

export const UserProfile = ({ user }: Props) => {
    const displayName = user.name || user.username || user.email || "User";
    const initial = String(displayName).charAt(0).toUpperCase();

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(displayName);

    const { data: avatarUrl } = useAvatarQuery();
    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatarMutation();
    const { mutate: updateProfile, isPending: isUpdatingName } = useUpdateProfileMutation();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<HTMLSpanElement>(null);

    // Цветок раскрывается под музыку, лепестки отлетают на ударах
    useBloom(pillRef, layerRef);

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

            {/* Плашка профиля */}
            <div
                ref={pillRef}
                style={pillStyle}
                className="relative flex items-center gap-2.5 sm:gap-3 min-w-0 pl-1.5 sm:pl-2 pr-2.5 sm:pr-4 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.07]"
            >
                {/* Аватар: цветок сакуры позади, кольцо мягкого розового */}
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    title="Изменить аватар"
                    aria-label="Изменить аватар"
                    className="relative group shrink-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                >
                    <BloomPetals />

                    <span
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
                                <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/30 to-pink-300/20 text-pink-200 text-sm font-bold">
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

                    {/* Слой для падающих лепестков (поверх всего) */}
                    <span ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />

                    {/* Точка «онлайн» */}
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
                            <span className="font-semibold text-xs sm:text-sm tracking-wide truncate max-w-[64px] min-[400px]:max-w-[90px] sm:max-w-[120px] lg:max-w-[160px] text-zinc-200 transition-colors duration-300 group-hover/name:text-pink-300">
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