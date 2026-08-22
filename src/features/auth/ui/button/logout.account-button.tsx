import {useMeQuery} from "../../../../hooks/useMyQuery.ts";
import {Link} from "@tanstack/react-router";
import {useLogoutMutation} from "../../api/use-logout-mutation.tsx";

export const AuthBlock = () => {
    const { data: user, isLoading } = useMeQuery();
    const logout = useLogoutMutation()

    const handleLogout = () => {
        logout.mutate()
    };

    if (isLoading) {
        return <span>Загрузка...</span>;
    }

    if (user) {
        return (
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                {/*{user.avatar && (*/}
                {/*    <img*/}
                {/*        src={user.avatar}*/}
                {/*        alt={user.name}*/}
                {/*        style={{width: 32, height: 32, borderRadius: '50%'}}*/}
                {/*    />*/}
                {/*)}*/}
                <Link to="/my-playlists" activeOptions={{exact: true}}> {user.userId ?? user.login} ID</Link>
                <button type="button" onClick={handleLogout}>
                    Выйти
                </button>
            </div>
        );
    }


}