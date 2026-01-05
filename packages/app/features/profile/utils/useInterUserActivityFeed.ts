import type { PostgrestError } from '@supabase/postgrest-js'
import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { type Activity, EventArraySchema, Events } from 'app/utils/zod/activity'
import type { ZodError } from 'zod'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { Address } from 'viem'
import { useMemo } from 'react'

const PENDING_TRANSFERS_INTERVAL = 3_000 // 3 seconds
const MAX_PENDING_TIME = 30_000 // 30 seconds - stop aggressive polling after this

/**
 * Infinite query to fetch ERC-20 token activity feed between the current user and another profile.
 *
 * @param pageSize - number of items to fetch per page
 * @param refetchInterval - Interval in milliseconds to automatically refetch the data.
 * @param currentUserId - The ID of the current logged in user. If undefined, the query will not be enabled.
 * @param otherUserId - The ID of the other user. If undefined, the query will not be enabled.
 * @param externalAddress - Optional external address to query activity for. If provided, otherUserId is ignored.
 */

export function useInterUserActivityFeed(params: {
  pageSize?: number
  refetchInterval?: number
  currentUserId?: number
  otherUserId?: number
  externalAddress?: Address
  ascending?: boolean
}): UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError> {
  const {
    pageSize = 3,
    refetchInterval = 30_000,
    otherUserId,
    currentUserId,
    externalAddress,
    ascending = false,
  } = params

  const supabase = useSupabase()

  // Convert address to bytea format for querying
  const addressBytea = useMemo(
    () => (externalAddress ? hexToBytea(externalAddress) : null),
    [externalAddress]
  )

  async function fetchInterUserActivityFeed({
    pageParam,
  }: {
    pageParam: number
  }): Promise<Activity[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1

    // Build different queries for external addresses vs user-to-user
    let request = supabase.from('activity_feed').select('*')

    if (addressBytea) {
      // Query for external address: find activities where address appears in data.f, data.t, or data.sender
      request = request.or(
        `data->>f.eq.${addressBytea},data->>t.eq.${addressBytea},data->>sender.eq.${addressBytea}`
      )
    } else {
      // User-to-user query
      request = request.or(
        `and(from_user->send_id.eq.${currentUserId},to_user->send_id.eq.${otherUserId}), and(from_user->send_id.eq.${otherUserId},to_user->send_id.eq.${currentUserId})`
      )
    }

    request = request
      .in('event_name', [
        Events.SendAccountTransfers,
        Events.SendAccountReceive,
        Events.TemporalSendAccountTransfers,
      ])
      .order('created_at', { ascending })
      .range(from, to)

    const { data, error } = await request
    throwIf(error)
    return EventArraySchema.parse(data)
  }

  return useInfiniteQuery({
    queryKey: externalAddress
      ? ['inter_user_activity_feed', 'external', externalAddress, currentUserId]
      : ['inter_user_activity_feed', otherUserId, currentUserId],
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage !== null && lastPage.length < pageSize) return undefined
      return lastPageParam + 1
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      if (firstPageParam <= 1) {
        return undefined
      }
      return firstPageParam - 1
    },
    queryFn: fetchInterUserActivityFeed,
    refetchInterval: ({ state: { data } }) => {
      const { pages } = data ?? {}
      if (!pages || !pages[0]) return refetchInterval
      const activities = pages.flat()

      // Find pending temporal transfers
      const pendingTransfers = activities.filter(
        (a) =>
          a.event_name === Events.TemporalSendAccountTransfers &&
          !['cancelled', 'failed'].includes(a.data.status)
      )

      if (pendingTransfers.length === 0) {
        return refetchInterval // No pending transfers, use normal interval
      }

      // Check if any pending transfer is still fresh
      const now = Date.now()
      const hasFreshPendingTransfer = pendingTransfers.some((transfer) => {
        const createdAt = new Date(transfer.created_at).getTime()
        const age = now - createdAt
        return age < MAX_PENDING_TIME
      })

      // Poll aggressively only if there's a fresh pending transfer
      return hasFreshPendingTransfer ? PENDING_TRANSFERS_INTERVAL : refetchInterval
    },
    // Enable for external address OR for user-to-user queries
    enabled: !!currentUserId && (!!externalAddress || !!otherUserId),
  })
}
