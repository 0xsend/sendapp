/**
 * Hook that fetches activity feed and transforms it using requestIdleCallback.
 * Native version - processes in background during idle time to keep main thread free.
 */

import { useEffect, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import type { Activity } from 'app/utils/zod/activity'
import type { SwapRouter } from 'app/utils/zod/SwapRouterSchema'
import type { LiquidityPool } from 'app/utils/zod/LiquidityPoolSchema'
import type { AddressBook } from 'app/utils/useAddressBook'
import { useActivityFeed } from './useActivityFeed'
import { processInChunks } from './idleProcessor'
import {
  groupActivitiesByDate,
  transformActivity,
  type TransformContext,
} from './activityTransform'
import type { ActivityRow, HeaderRow } from './activityRowTypes'
import { SENDPOT_CONTRACT_ADDRESS } from 'app/data/sendpot'
import {
  baseMainnet,
  sendCheckAddress,
  sendtagCheckoutAddress,
  sendTokenV0Address,
} from '@my/wagmi'

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
 * Hook that fetches and processes activity feed in background (native version).
 */
export function useProcessedActivityFeed(options: UseProcessedActivityFeedOptions) {
  const { t, locale, swapRouters, liquidityPools, addressBook } = options
  const activityFeedQuery = useActivityFeed()

  const [processedData, setProcessedData] = useState<ActivityRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const hasProcessedInitialData = useRef(false)

  const pages = activityFeedQuery.data?.pages

  // Process data when it changes
  useEffect(() => {
    // Cancel any ongoing processing
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
    }

    if (!pages || pages.length === 0) {
      setProcessedData([])
      hasProcessedInitialData.current = false
      return
    }

    // Only show processing state for initial load, not for subsequent pages
    if (!hasProcessedInitialData.current) {
      setIsProcessing(true)
    }

    // Flatten and dedupe activities
    const activities = pages.flat()
    const seenEventIds = new Set<string>()
    const uniqueActivities = activities.filter((activity) => {
      if (seenEventIds.has(activity.event_id)) return false
      seenEventIds.add(activity.event_id)
      return true
    })

    // Group by date first (this is fast)
    const groups = groupActivitiesByDate(uniqueActivities, t, locale)

    // Pre-compute context (addresses, formatter)
    const routerAddrs = new Set((swapRouters || []).map((r) => r.router_addr.toLowerCase()))
    const poolAddrs = new Set((liquidityPools || []).map((p) => p.pool_addr.toLowerCase()))
    const addrCtx = {
      routerAddrs,
      poolAddrs,
      sendPotAddr: SENDPOT_CONTRACT_ADDRESS.toLowerCase(),
      sendCheckAddr: sendCheckAddress?.[baseMainnet.id]?.toLowerCase(),
      sendtagCheckoutAddr: sendtagCheckoutAddress[baseMainnet.id]?.toLowerCase(),
      sendTokenV0Addr: sendTokenV0Address[baseMainnet.id]?.toLowerCase(),
    }
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const now = Date.now()
    const ctx: TransformContext = { t, locale, swapRouters, liquidityPools, addressBook }

    // Build a flat list of items to process: headers and activities
    type WorkItem =
      | { type: 'header'; title: string; sectionIndex: number }
      | {
          type: 'activity'
          activity: Activity
          sectionIndex: number
          isFirst: boolean
          isLast: boolean
        }

    const workItems: WorkItem[] = []
    groups.forEach((group, sectionIndex) => {
      workItems.push({ type: 'header', title: group.title, sectionIndex })
      const count = group.activities.length
      group.activities.forEach((activity, idx) => {
        workItems.push({
          type: 'activity',
          activity,
          sectionIndex,
          isFirst: idx === 0,
          isLast: idx === count - 1,
        })
      })
    })

    // Process items in chunks during idle time
    const cancel = processInChunks<WorkItem, ActivityRow>(
      workItems,
      (item) => {
        if (item.type === 'header') {
          return {
            kind: 'header',
            title: item.title,
            sectionIndex: item.sectionIndex,
          } as HeaderRow
        }
        return transformActivity(
          item.activity,
          ctx,
          addrCtx,
          formatter,
          now,
          item.isFirst,
          item.isLast,
          item.sectionIndex
        )
      },
      (results) => {
        setProcessedData(results)
        setIsProcessing(false)
        hasProcessedInitialData.current = true
        cancelRef.current = null
      },
      { timeout: 50 } // Force processing within 50ms if not idle
    )

    cancelRef.current = cancel

    return () => {
      if (cancelRef.current) {
        cancelRef.current()
        cancelRef.current = null
      }
    }
  }, [pages, locale, swapRouters, liquidityPools, addressBook, t])

  // Derive loading state synchronously to avoid flash of "No Activities"
  // This covers the gap between data arriving and effect setting isProcessing=true
  const hasRawData = pages && pages.length > 0
  const needsProcessing =
    hasRawData && processedData.length === 0 && !hasProcessedInitialData.current

  return {
    ...activityFeedQuery,
    processedData,
    isProcessing: isProcessing || needsProcessing,
  }
}
