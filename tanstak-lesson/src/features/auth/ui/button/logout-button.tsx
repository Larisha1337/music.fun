import { useLogoutMutation } from "@/features/auth/api/use-logout-mutation.tsx";

const LogoutIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export const LogoutButton = () => {
    const { mutate, isPending } = useLogoutMutation();

    return (
        <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
            title="Выйти"
            aria-label="Выйти"
            className="group flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-full text-sm font-medium text-zinc-400
                       border border-white/10 bg-white/[0.03] backdrop-blur-md cursor-pointer
                       transition-all duration-300
                       hover:text-rose-300 hover:border-rose-400/40 hover:bg-rose-500/10
                       active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
        >
            <LogoutIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span className="hidden sm:inline">{isPending ? 'Выход...' : 'Выйти'}</span>
        </button>
    );
};