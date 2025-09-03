import { type CreateTRPCReact, createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from '@my/api'
import { httpBatchLink, httpLink, splitLink } from '@trpc/client'
import SuperJSON from 'superjson'
import getBaseUrl from './getBaseUrl'
import { supabase } from './supabase/client.native'

export const api: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()
export const createTrpcClient = () =>
  api.createClient({
    links: [
      splitLink({
        condition(op) {
          return op.type === 'query' && op.path.startsWith('coinGecko.')
        },
        // Public coin endpoints -> GET without auth/cookies to enable CDN caching
        true: httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: SuperJSON,
          fetch(url, opts) {
            return fetch(url, { ...opts, credentials: 'omit' })
          },
        }),
        // Everything else stays batched with Authorization headers
        false: httpBatchLink({
          transformer: SuperJSON,
          url: `${getBaseUrl()}/api/trpc`,
          async headers() {
            const headers = new Map<string, string>()
            headers.set('x-trpc-source', 'expo-react')
            const session = (await supabase.auth.getSession()).data.session

            if (session?.access_token) {
              headers.set('Authorization', `Bearer ${session.access_token}`)
              headers.set('Refresh-Token', `${session.refresh_token}`)
            }
            return Object.fromEntries(headers)
          },
        }),
      }),
    ],
  })

export type { RouterInputs, RouterOutputs } from '@my/api'
