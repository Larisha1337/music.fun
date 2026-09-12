import { Link } from "@tanstack/react-router";
import { LogoutButton } from "./button/logout-button.tsx";
import { useAvatarQuery } from "../../avatar/api/use-avatar-query.ts";
import { useUploadAvatarMutation } from "../../avatar/api/use-upload-avatar-mutation.ts";

type Props = {
    user: any;
};

export const UserProfile = ({ user }: Props) => {
    const displayName = user.login ?? user.userId ?? "User";
    const initial = String(displayName).charAt(0).toUpperCase();

    const { data: avatarUrl } = useAvatarQuery();
    const { mutate: uploadAvatar, isPending } = useUploadAvatarMutation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAvatar(file);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-800/40 border border-[#27272a] rounded-xl">
                {/* Кликабельный аватар для загрузки файла */}
                <label className="relative group cursor-pointer shrink-0">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isPending}
                    />

                    {avatarUrl ? (
                        <img
                            src={`http://localhost:5000${avatarUrl}`}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                    ) : (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold group-hover:bg-indigo-500/40 transition-colors">
                            {isPending ? "..." : initial}
                        </div>
                    )}

                    {/* Оверлей при наведении */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-bold">+</span>
                    </div>
                </label>

                <Link
                    to="/my-playlists"
                    activeOptions={{ exact: true }}
                    className="text-zinc-300 hover:text-white font-semibold text-sm pr-1 tracking-wide truncate max-w-[120px]"
                >
                    {displayName}
                </Link>
            </div>

            <LogoutButton />
        </div>
    );
};