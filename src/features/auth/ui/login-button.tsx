import {useMutation} from "@tanstack/react-query";
import {client} from "../../../shared/api/client.ts";

export const LoginButton = () => {
    const callbackUrl = 'http://localhost:5173/oauth/callback'

    const mutation = useMutation({
        mutationFn: async ({code}: { code: string }) => {
            const response = await client.POST('/auth/login', {
                body: {
                    code: code,
                    redirectUri: callbackUrl,
                    rememberMe: true,
                    accessTokenTTL: '1d'
                }
            })
            if (response.error) {
                throw response.error;
            }
            return response.data
        },
        onSuccess: (data) => {
            localStorage.setItem('musicfun-refresh-token', data.refreshToken)
            localStorage.setItem('musicfun-access-token', data.accessToken)
        }
    })
    const handleLoginClick = () => {
        window.addEventListener('message', handleOauthMessage)

        window.open(`https://musicfun.it-incubator.app/api/1.0/auth/oauth-redirect?callbackUrl=${callbackUrl}`, 'apihub-oauth2', 'width=600,height=600')
        // mutation.mutate({code: '????'})
    }
    const handleOauthMessage = (event: MessageEvent) => {
        window.removeEventListener('message', handleOauthMessage)
        if (event.origin !== document.location.origin) {
            console.warn('origin not match')
            return;
        }


        const code = event.data.code
        if (!code) {
            console.warn('code not found')
            return;
        }


        mutation.mutate({code})
    }

    // useEffect(() => {
    //     window.addEventListener('message', handleOauthMessage)
    //     return () => {
    //         window.removeEventListener('message', handleOauthMessage)
    //     }
    // }, [])
    return (
        <button onClick={handleLoginClick}>
            Login with APIHUB
        </button>
    )

};