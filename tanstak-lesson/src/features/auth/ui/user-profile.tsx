import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAvatarQuery } from "../../avatar/api/use-avatar-query.ts";
import { useUploadAvatarMutation } from "../../avatar/api/use-upload-avatar-mutation.ts";
import { useUpdateProfileMutation } from "@/features/auth/api/use-update-profile-mutation.ts"; // Подправь путь
import { LogoutButton } from "@/features/auth/ui/button/logout-button.tsx";

type Props = {
    user: {
        email?: string;
        name?: string;
        username?: string;
    };
};

const MY_API_BASE = import.meta.env.VITE_MY_BACKEND_URL || 'http://localhost:5000';

export const UserProfile = ({ user }: Props) => {
    // Отображаем имя пользователя или email, если имя еще не задано
    const displayName = user.name || user.username || user.email || "User";
    const initial = String(displayName).charAt(0).toUpperCase();

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(displayName);

    const { data: avatarUrl } = useAvatarQuery();
    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatarMutation();
    const { mutate: updateProfile, isPending: isUpdatingName } = useUpdateProfileMutation();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAvatar(file);
        }
        if (e.target) {
            e.target.value = "";
        }
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
            {
                onSuccess: () => setIsEditingName(false),
            }
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
        <div className="flex items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-800/40 border border-[#27272a] rounded-xl">
                {/* Аватарка */}
                <div
                    onClick={handleAvatarClick}
                    className="relative group w-7 h-7 rounded-full overflow-hidden shrink-0 cursor-pointer"
                    title="Изменить аватар"
                >
                    {avatarUrl ? (
                        <img
                            src={`${MY_API_BASE}${avatarUrl}`}
                            alt={displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                            {initial}
                        </div>
                    )}

                    <div
                        className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                            isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                    >
                        {isUploadingAvatar ? (
                            <span className="text-[10px] text-white animate-spin">⏳</span>
                        ) : (
                            <span className="text-[10px] text-white">📷</span>
                        )}
                    </div>
                </div>

                {/* Никнейм или поле ввода */}
                {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isUpdatingName}
                            className="px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-indigo-500 max-w-[120px]"
                        />
                        <button
                            type="button"
                            onClick={() => handleSaveName()}
                            disabled={isUpdatingName}
                            className="text-xs text-green-400 hover:text-green-300 font-semibold px-1 cursor-pointer"
                        >
                            ✓
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setNameInput(displayName);
                                setIsEditingName(false);
                            }}
                            className="text-xs text-zinc-400 hover:text-white px-1 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            to="/my-tracks"
                            activeOptions={{ exact: true }}
                            className="font-semibold text-sm tracking-wide truncate max-w-[120px] text-zinc-300 hover:text-white transition-colors"
                        >
                            {displayName}
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setNameInput(displayName);
                                setIsEditingName(true);
                            }}
                            title="Изменить имя"
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                            ✏️
                        </button>
                    </div>
                )}
            </div>

            <LogoutButton />
        </div>
    );
};