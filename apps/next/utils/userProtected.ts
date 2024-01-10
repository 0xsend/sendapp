import { ParsedUrlQuery } from 'querystring'
import { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { GetServerSideProps, PreviewData } from 'next'

import debug from 'debug'

const log = debug('next:utils:userProtected')

/**
 * getServerSideProps for auth pages - will redirect authenticated users - pass your own function as the only arg
 */
export function userProtectedGetSSP<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          destination: '/sign-in',
          permanent: false,
        },
      }
    }

    // check for send accounts and redirect to onboarding if none
    const { error, count: sendAcctCount } = await supabase
      .from('send_accounts')
      .select('*', { count: 'exact', head: true })

    if (error) {
      log('error getting send accounts', error)
      throw error
    }

    if (
      sendAcctCount === 0 &&
      ((ctx.req.url?.startsWith('/_next') && !ctx.req.url?.endsWith('onboarding.json')) ||
        (!ctx.req.url?.startsWith('/_next') && !ctx.req.url?.endsWith('onboarding')))
    ) {
      log('no send accounts')
      return {
        redirect: {
          destination: '/onboarding',
          permanent: false,
        },
      }
    }

    const getSSRResult = getServerSideProps ? await getServerSideProps(ctx) : { props: {} as Props }
    if ('props' in getSSRResult) {
      // add the initialSession to page's getServerSideProps
      // biome-ignore lint/suspicious/noExplicitAny: any is required here
      ;(getSSRResult.props as any).initialSession = session
    }
    return getSSRResult
  }
}
