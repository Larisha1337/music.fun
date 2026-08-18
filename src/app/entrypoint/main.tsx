import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import '../styles/reset.css'
import '../styles/index.css'
import {createRouter, RouterProvider} from "@tanstack/react-router";
import { routeTree } from "../../routes/routeTree.gen.ts";

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        }
    }
})



createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
    <RouterProvider router={router}/>
          <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
  </StrictMode>,
)
