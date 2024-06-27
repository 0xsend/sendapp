import type { ParsedUrlQuery } from 'node:querystring'
import type { Database } from '@my/supabase/database.types'
import type { GetServerSidePropsContext, PreviewData, Redirect } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import debug from 'debug'

const log = debug('api:utils:userOnboarded')

/**
 * check if user is onboarded and redirect to onboarding page
 */
export async function userOnboarded<
  Params extends ParsedUrlQuery = ParsedUrlQuery,
  Preview extends PreviewData = PreviewData,
>(
  supabase: SupabaseClient<Database>,
  ctx: GetServerSidePropsContext<Params, Preview>
): Promise<null | { redirect: Redirect }> {
  log('check for send accounts and redirect to onboarding if none.')
  const { error, count: sendAcctCount } = await supabase
    .from('send_accounts')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('error getting send accounts', error, (error as unknown as Error).cause ?? null)
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
        destination: '/auth/onboarding', // @todo add query param to redirect back to page after onboarding
        permanent: false,
      },
    }
  }
  return null
}
