/**
 * Activity hooks is a new version of the activity utils. This file was created to
 * avoid large conflicts due to the introduction of the activity hooks and
 * the address book.
 *
 * The activity hooks are capapble of returning React components handling more
 * complex cases when rendering an activity. This is useful for cases like
 * Send Earn deposits and withdrawals, where the amount is calculated based on
 * the underlying vault or the addresses are only known in the address book.
 *
 * Once `dev` and the activity feed is stable, this file can be consolidated
 * into the `activity` file again.
 */

import { SendEarnAmount } from 'app/features/earn/components/SendEarnAmount'
import type { ReactNode } from 'react'
import { amountFromActivity } from './activity'
import { type Activity, isSendEarnEvent } from './zod/activity'
import type { LiquidityPool } from './zod/LiquidityPoolSchema'
import type { SwapRouter } from './zod/SwapRouterSchema'

/**
 * Returns the amount of the activity if there is one.
 */
export function useAmountFromActivity(
  activity: Activity,
  swapRouters?: SwapRouter[],
  liquidityPools?: LiquidityPool[]
): ReactNode {
  if (isSendEarnEvent(activity)) {
    return <SendEarnAmount activity={activity} />
  }
  return amountFromActivity(activity, swapRouters, liquidityPools)
}
