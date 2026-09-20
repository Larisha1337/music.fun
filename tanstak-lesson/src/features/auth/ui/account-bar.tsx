import { useMeQuery } from "@/hooks/useMeQuery.ts";
import { LoginForm } from "./login-form.tsx";
import { UserProfile } from "./user-profile.tsx";

export const AccountBar = () => {
    const { data: user, isLoading } = useMeQuery();

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            {user ? <UserProfile user={user} /> : <LoginForm />}
        </div>
    );
};