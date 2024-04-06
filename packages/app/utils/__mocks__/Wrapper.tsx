import { TamaguiProvider, config } from '@my/ui'
import { QueryClient, type QueryClientConfig, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

/**
 * Wrapper for tests that use react-query and tamagui
 */
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
            gcTime: Number.POSITIVE_INFINITY,
            ...defaultOptions?.queries,
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        {children}
      </TamaguiProvider>
    </QueryClientProvider>
  )
}
