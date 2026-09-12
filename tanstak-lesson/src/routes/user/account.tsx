import { createFileRoute } from '@tanstack/react-router'
import Account from "../../pages/user/account.tsx";

export const Route = createFileRoute('/user/account')({
  component: Account,
})
