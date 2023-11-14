import { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { GetServerSideProps, PreviewData } from 'next'
import { ParsedUrlQuery } from 'querystring'

/**
 * getServerSideProps for auth pages - will redirect authenticated users - pass your own function as the only arg
 */
export function userProtectedGetSSP<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Props extends { [key: string]: any } = { [key: string]: any },
  Params extends ParsedUrlQuery = ParsedUrlQuery,
  Preview extends PreviewData = PreviewData
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
      return {
        redirect: {
          destination: '/sign-in',
          permanent: false,
        },
      }
    }

    const getSSRResult = getServerSideProps ? await getServerSideProps(ctx) : { props: {} as Props }
    if ('props' in getSSRResult) {
      // add the initialSession to page's getServerSideProps
      ;(getSSRResult.props as any).initialSession = session
    }
    return getSSRResult
  }
}
