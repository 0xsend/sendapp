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

const PENDING_TRANSFERS_INTERVAL = 3_000 // 1 second
const MAX_PENDING_TIME = 30_000 // 2 minutes - stop aggressive polling after this

/**
 * Infinite query to fetch ERC-20 token activity feed between the current user and another profile.
 *
 * IMPORTANT: Recipients do not see temporal (pending) transfers due to activity_feed view filtering.
 * Only senders see temporal transfers. This is intentional UX to avoid showing pending states to recipients.
 * The backend view filters out temporal activities where the current user is the recipient:
 * WHERE ((a.from_user_id = auth.uid()) OR ((a.to_user_id = auth.uid()) AND (a.event_name !~~ 'temporal_%')))
 *
 * @param pageSize - number of items to fetch per page
 * @param refetchInterval - Interval in milliseconds to automatically refetch the data.
 * @param currentUserId - The ID of the current logged in user. If undefined, the query will not be enabled.
 * @param otherUserId - The ID of the other user. If undefined, the query will not be enabled.
 */

export function useInterUserActivityFeed(params: {
  pageSize?: number
  refetchInterval?: number
  currentUserId?: number
  otherUserId?: number
  ascending?: boolean
}): UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError> {
  const {
    pageSize = 3,
    refetchInterval = 30_000,
    otherUserId,
    currentUserId,
    ascending = false,
  } = params

  const supabase = useSupabase()

  async function fetchInterUserActivityFeed({
    pageParam,
  }: {
    pageParam: number
  }): Promise<Activity[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const request = supabase
      .from('activity_feed')
      .select('*')
      .or(
        `and(from_user->send_id.eq.${currentUserId},to_user->send_id.eq.${otherUserId}), and(from_user->send_id.eq.${otherUserId},to_user->send_id.eq.${currentUserId})`
      )
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
    queryKey: ['inter_user_activity_feed', otherUserId, currentUserId],
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

      // Find pending temporal transfers - only poll for truly pending statuses
      // Once a transfer is 'confirmed', it will soon be replaced by an indexed activity
      const pendingTransfers = activities.filter(
        (a) =>
          a.event_name === Events.TemporalSendAccountTransfers &&
          ['initialized', 'submitted', 'sent'].includes(a.data.status)
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
    enabled: !!currentUserId && !!otherUserId,
  })
}
