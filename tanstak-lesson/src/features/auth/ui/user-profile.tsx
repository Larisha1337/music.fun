import { Link } from "@tanstack/react-router";
import { useAvatarQuery } from "../../avatar/api/use-avatar-query.ts";
import {LogoutButton} from "@/features/auth/ui/button/logout-button.tsx";

type Props = {
    user: any;
};

export const UserProfile = ({ user }: Props) => {
    const displayName = user.email ?? "User";
    const initial = String(displayName).charAt(0).toUpperCase();
    const { data: avatarUrl } = useAvatarQuery();

    return (
        <div className="flex items-center gap-4">
            <Link
                to="/my-playlists"
                activeOptions={{ exact: true }}
                className="flex items-center gap-3 px-3 py-1.5 bg-zinc-800/40 hover:bg-zinc-800 border border-[#27272a] hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
                {avatarUrl ? (
                    <img
                        src={`http://localhost:5000${avatarUrl}`}
                        alt={displayName}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                ) : (
                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold shrink-0">
                        {initial}
                    </div>
                )}
                <span className="font-semibold text-sm pr-1 tracking-wide truncate max-w-[120px]">
                    {displayName}
                </span>
            </Link>
            <LogoutButton />
        </div>
    );
};