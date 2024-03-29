import type { AppRouter } from '@my/api'
import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import SuperJSON from 'superjson'
import { getBaseUrl } from './getBaseUrl'

export const api = createTRPCNext<AppRouter>({
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
