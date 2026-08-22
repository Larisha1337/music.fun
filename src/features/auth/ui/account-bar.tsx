import {useMeQuery} from "../../../hooks/useMyQuery.ts"
import {LoginButton} from "./button/login-button.tsx";
import {AuthBlock} from "./button/logout.account-button.tsx";

export const AccountBar = () => {
    const query = useMeQuery();
return (
    <div>
        {!query.data && <LoginButton/>}
        {query.data && <AuthBlock/>}
    </div>
)
}