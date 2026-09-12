import { useMeQuery } from "../../../hooks/useMeQuery.ts";
import { LoginButton } from "./button/login-button.tsx";
import { UserProfile } from "./user-profile.tsx";

export const AccountBar = () => {
    const { data: user, isLoading } = useMeQuery();

    // Пока грузим - показываем скелетон или текст
    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            {user ? (
                // Если юзер есть - передаем его пропсами в профиль
                <UserProfile user={user} />
            ) : (
                // Если нет - показываем кнопку входа
                <LoginButton />
            )}
        </div>
    );
};