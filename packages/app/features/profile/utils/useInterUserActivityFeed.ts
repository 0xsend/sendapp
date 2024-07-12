import type { PostgrestError } from '@supabase/postgrest-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, type Activity } from 'app/utils/zod/activity'
import type { ZodError } from 'zod'

/**
 * Infinite query to fetch ERC-20 token activity feed between the current user and another profile.
 *
 * @param pageSize - number of items to fetch per page
 * @param refetchInterval - Interval in milliseconds to automatically refetch the data.
 * @param currentUserId - The ID of the current logged in user. If undefined, the query will not be enabled.
 * @param otherUserId - The ID of the other user. If undefined, the query will not be enabled.
 */

export function useInterUserActivityFeed(params: {
  pageSize?: number
  refetchInterval?: number
  currentUserId?: string
  otherUserId?: string
}): UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError> {
  const { pageSize = 3, refetchInterval = 30_000, otherUserId, currentUserId } = params

  const supabase = useSupabase()

  async function fetchInterUserActivityFeed({
    pageParam,
  }: { pageParam: number }): Promise<Activity[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const request = supabase
      .from('activity_feed')
      .select('*')
      .or(
        `and(from_user->send_id.eq.${currentUserId},to_user->send_id.eq.${otherUserId}), and(from_user->send_id.eq.${otherUserId},to_user->send_id.eq.${currentUserId})`
      )
      .in('event_name', ['send_account_transfers', 'send_account_receives '])
      .order('created_at', { ascending: false })
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
    refetchInterval,
    enabled: !!currentUserId && !!otherUserId,
  })
}
