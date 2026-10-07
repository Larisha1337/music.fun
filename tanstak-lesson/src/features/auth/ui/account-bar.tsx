import { useMeQuery } from "@/hooks/useMeQuery.ts";
import { LoginForm } from "./login-form.tsx";
import { UserProfile } from "./user-profile.tsx";

export const AccountBar = () => {
    const { data: user, isLoading } = useMeQuery();

    if (isLoading) {
        // Скелетон вместо текста «Загрузка...», размеры близки к профилю, чтобы хедер не прыгал
        return (
            <div className="flex items-center gap-3 animate-pulse" aria-label="Загрузка профиля">
                <div className="flex items-center gap-3 pl-1.5 pr-2 sm:pr-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10" />
                    <div className="hidden sm:block w-20 h-3 rounded bg-white/10" />
                </div>
                <div className="w-9 sm:w-20 h-9 rounded-full bg-white/[0.06]" />
            </div>
        );
    }

    return <div>{user ? <UserProfile user={user} /> : <LoginForm />}</div>;
};