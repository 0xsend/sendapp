import type { ParsedUrlQuery } from 'node:querystring'
import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { GetServerSideProps, PreviewData } from 'next'

import debug from 'debug'
import { userOnboarded } from './userOnboarded'

const log = debug('next:utils:userProtected')

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
    const supabase = createPagesServerClient<Database>(ctx)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // log user activity
    console.log(
      `${ctx.req.url} - ${ctx.req.headers['user-agent']}${
        ctx.req.headers['x-forwarded-for'] ? ` - ${ctx.req.headers['x-forwarded-for']}` : ''
      }`
    )

    if (!session) {
      log('no session')
      return {
        redirect: {
          destination: '/auth/sign-in', // @todo add query param to redirect back to page after sign in
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
