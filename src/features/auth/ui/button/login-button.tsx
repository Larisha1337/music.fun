import {callbackUrl, useLoginMutation} from "../../api/use-login-mutation.tsx";

export const LoginButton = () => {

    const mutation = useLoginMutation()

    const handleOauthMessage = (event: MessageEvent) => {
        if (event.origin !== document.location.origin) return;

        const code = event.data?.code;
        if (code) {
            window.removeEventListener('message', handleOauthMessage);
            mutation.mutate({ code });
        }
    };

    const handleLoginClick = () => {
        window.addEventListener('message', handleOauthMessage);
        window.open(
            `https://musicfun.it-incubator.app/api/1.0/auth/oauth-redirect?callbackUrl=${callbackUrl}`,
            'apihub-oauth2',
            'width=600,height=600'
        );
    };

    return (
        <button onClick={handleLoginClick} disabled={mutation.isPending}>
            {mutation.isPending ? 'Вход...' : 'Login with APIHUB'}
        </button>
    );
};