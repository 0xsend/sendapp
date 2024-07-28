import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import debug from 'debug'
import type { GetServerSideProps, PreviewData } from 'next'
import type { ParsedUrlQuery } from 'node:querystring'
import { userOnboarded } from './userOnboarded'

const log = debug('api:utils:userProtected')

/**
 * getServerSideProps for auth pages - will redirect authenticated users - pass your own function as the only arg
 */
export function userProtectedGetSSP<
  // biome-ignore lint/suspicious/noExplicitAny: any is required here
  Props extends { [key: string]: any } = { [key: string]: any },
  Params extends ParsedUrlQuery = ParsedUrlQuery,
  Preview extends PreviewData = PreviewData,
>(
  getServerSideProps?: GetServerSideProps<Props, Params, Preview>
): GetServerSideProps<Props, Params, Preview> {
  return async (ctx) => {
    log('connecting to supabase', process.env.NEXT_PUBLIC_SUPABASE_URL)
    const supabase = createPagesServerClient<Database>(ctx)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      log('no session')
      const destination =
        ctx.req.url === undefined || ctx.req.url.includes('/auth')
          ? '/auth/sign-in'
          : `/auth/sign-in?redirectUri=${encodeURIComponent(ctx.req.url)}`

      return {
        redirect: {
          destination,
          permanent: false,
        },
      }
    }

    const needsOnboarding = await userOnboarded(supabase, ctx)
    if (needsOnboarding) return needsOnboarding

    const getSSRResult = getServerSideProps ? await getServerSideProps(ctx) : { props: {} as Props }
    if ('props' in getSSRResult) {
      // add the initialSession to page's getServerSideProps
      // biome-ignore lint/suspicious/noExplicitAny: any is required here
      ;(getSSRResult.props as any).initialSession = session
    }
    return getSSRResult
  }
}
