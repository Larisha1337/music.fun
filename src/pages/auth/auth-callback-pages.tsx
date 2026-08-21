import {useEffect} from "react";

const OAuthCallbackPage = () => {

    useEffect(() => {
          const url = new URL(window.location.href)
          const code = url.searchParams.get("code")
        if (code && window.opener) {
            window.opener.postMessage({code}, window.location.origin)
        }

        window.close()
    }, [])

    return (
        <div>
            <h2>Oauth Callback page</h2>
        </div>
    )
}

export default OAuthCallbackPage
