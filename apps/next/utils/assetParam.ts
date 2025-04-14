import { paramToCoin } from 'app/features/earn/params'
import { debug } from 'debug'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import type { ParsedUrlQuery } from 'node:querystring'

const log = debug('app:utils:assetParam')

interface AssetParams extends ParsedUrlQuery {
  asset?: string
}

/**
 * Helper function to validate the asset parameter for all routes under the [asset] parameterized route.
 *
 * @param context - The GetServerSidePropsContext from Next.js
 * @param getSSP - The function to call if the asset is valid (e.g., userProtectedGetSSP())
 * @returns GetServerSidePropsResult based on asset validation
 */
export function assetParam(
  context: GetServerSidePropsContext,
  getSSP: () => (
    context: GetServerSidePropsContext
  ) => Promise<GetServerSidePropsResult<Record<string, unknown>>>
): Promise<GetServerSidePropsResult<Record<string, unknown>>> {
  const { asset } = context.params as AssetParams

  if (!asset) {
    log('no asset')
    return Promise.resolve({
      redirect: {
        destination: '/earn',
        permanent: false,
      },
    })
  }

  if (!paramToCoin(asset)) {
    log('coin not supported', asset)
    // 404 if coin is not supported
    return Promise.resolve({
      notFound: true,
    })
  }

  // Asset is valid, proceed with the provided getSSP function
  return getSSP()(context)
}
