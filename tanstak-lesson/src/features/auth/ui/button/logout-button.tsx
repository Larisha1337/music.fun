import { useLogoutMutation } from "../../api/use-logout-mutation.tsx";

export const LogoutButton = () => {
    const { mutate, isPending } = useLogoutMutation();

    return (
        <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
        >
            {isPending ? 'Выход...' : 'Выйти'}
        </button>
    );
};