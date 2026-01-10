/**
 * Hook that transforms a single Activity into a typed ActivityRow.
 * Centralizes context setup (swap routers, liquidity pools, address book).
 */

import { useMemo } from 'react'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useAddressBook } from 'app/utils/useAddressBook'
import type { Activity } from 'app/utils/zod/activity'
import { transformActivity, createAddressContext } from './activityTransform'
import type { ActivityRow, HeaderRow } from './activityRowTypes'

// Dummy translation function - returns key as-is for standalone usage
const dummyT = ((key: string) => key) as Parameters<typeof transformActivity>[1]['t']

/**
 * Transforms a single Activity into a typed ActivityRow.
 * Uses hooks to fetch swap routers, liquidity pools, and address book.
 *
 * @param activity - The activity to transform
 * @param locale - Optional locale for date formatting (defaults to 'en')
 * @returns The transformed ActivityRow (excluding HeaderRow)
 */
export function useActivityRow(
  activity: Activity | undefined,
  locale = 'en'
): Exclude<ActivityRow, HeaderRow> | null {
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { data: addressBook } = useAddressBook()

  return useMemo(() => {
    if (!activity) return null

    const ctx = {
      t: dummyT,
      locale,
      swapRouters,
      liquidityPools,
      addressBook,
    }
    const addrCtx = createAddressContext(swapRouters, liquidityPools)
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const now = Date.now()

    return transformActivity(
      activity,
      ctx,
      addrCtx,
      formatter,
      now,
      false, // isFirst - not relevant for single activity
      false, // isLast - not relevant for single activity
      0 // sectionIndex - not relevant for single activity
    )
  }, [activity, locale, swapRouters, liquidityPools, addressBook])
}
