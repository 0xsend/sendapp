import { QueryClient, QueryClientConfig, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Wrapper({
  children,
  defaultOptions,
}: { children: React.ReactNode; defaultOptions?: QueryClientConfig['defaultOptions'] }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          ...defaultOptions,
          queries: {
            retry: false,
            gcTime: Infinity,
            ...defaultOptions?.queries,
          },
        },
      })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
