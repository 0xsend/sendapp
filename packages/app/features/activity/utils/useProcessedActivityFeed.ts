/**
 * Hook that fetches activity feed and transforms it synchronously.
 * Web version - Safari doesn't support requestIdleCallback and web doesn't have perf issues.
 */

import type { TFunction } from 'i18next'
import type { SwapRouter } from 'app/utils/zod/SwapRouterSchema'
import type { LiquidityPool } from 'app/utils/zod/LiquidityPoolSchema'
import type { AddressBook } from 'app/utils/useAddressBook'
import { useActivityFeed } from './useActivityFeed'
import { transformActivitiesToRows } from './activityTransform'

// Re-export types for convenience
export type { ActivityRow } from './activityRowTypes'
export * from './activityRowTypes'

interface UseProcessedActivityFeedOptions {
  t: TFunction<'activity'>
  locale: string
  swapRouters: SwapRouter[] | undefined
  liquidityPools: LiquidityPool[] | undefined
  addressBook: AddressBook | undefined
}

/**
 * Hook that fetches and processes activity feed synchronously (web version).
 */
export function useProcessedActivityFeed(options: UseProcessedActivityFeedOptions) {
  const { t, locale, swapRouters, liquidityPools, addressBook } = options
  const activityFeedQuery = useActivityFeed()

  const pages = activityFeedQuery.data?.pages

  const processedData = pages
    ? transformActivitiesToRows(pages, { t, locale, swapRouters, liquidityPools, addressBook })
    : []

  return {
    ...activityFeedQuery,
    processedData,
    isProcessing: false,
  }
}
