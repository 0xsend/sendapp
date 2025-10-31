import type { AppRouter } from '@my/api'
import { httpBatchLink, httpLink, splitLink } from '@trpc/client'
import { type CreateTRPCNext, createTRPCNext } from '@trpc/next'
import SuperJSON from 'superjson'
import getBaseUrl from './getBaseUrl'
import type { NextPageContext } from 'next/types'

export const api: CreateTRPCNext<AppRouter, NextPageContext> = createTRPCNext<AppRouter>({
  config() {
    const url = `${getBaseUrl()}/api/trpc`
    return {
      links: [
        splitLink({
          condition(op) {
            // Route public coin endpoints over GET to enable Vercel CDN caching
            return op.type === 'query' && op.path.startsWith('coinGecko.')
          },
          true: httpLink({
            url,
            transformer: SuperJSON,
            // Omit credentials so responses can be cached by CDN
            fetch(url, opts) {
              return fetch(url, { ...opts, credentials: 'omit' } as RequestInit)
            },
          }),
          // All other procedures remain batched over POST
          false: httpBatchLink({ url, transformer: SuperJSON }),
        }),
      ],
    }
  },
  transformer: SuperJSON,
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
})
