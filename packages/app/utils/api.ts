import type { AppRouter } from '@my/api'
import { httpBatchLink } from '@trpc/client'
import { type CreateTRPCNext, createTRPCNext } from '@trpc/next'
import SuperJSON from 'superjson'
import { getBaseUrl } from './getBaseUrl'
import type { NextPageContext } from 'next/types'

export const api: CreateTRPCNext<AppRouter, NextPageContext> = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: SuperJSON,
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
