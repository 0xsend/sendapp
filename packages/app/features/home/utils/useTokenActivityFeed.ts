import type { Database, PgBytea } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { getBaseAddressFilterCondition } from 'app/utils/activity'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import { useMemo } from 'react'
import type { ZodError } from 'zod'

const PENDING_TRANSFERS_INTERVAL = 1_000
const MAX_REFETCHES = 10 // 10 seconds

/**
 * Infinite query to fetch ERC-20 token activity feed.
 * Processes activities to handle special cases like Send Earn deposits.
 *
 * @note does not support ETH transfers. Need to add another shovel integration to handle ETH receives, and another one for ETH sends
 *
 * @param pageSize - number of items to fetch per page
 */
export function useTokenActivityFeed(params: {
  pageSize?: number
  address?: PgBytea
  refetchInterval?: number
  enabled?: boolean
}): UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError> {
  const { pageSize = 10, address, refetchInterval = 30_000, enabled: enabledProp = true } = params
  const supabase = useSupabase()
  const enabled = useMemo(() => enabledProp, [enabledProp])
  const queryKey = useMemo(
    () => ['token_activity_feed', { pageSize, address }] as const,
    [pageSize, address]
  )
  return useInfiniteQuery<
    Activity[],
    PostgrestError | ZodError,
    InfiniteData<Activity[], number>,
    typeof queryKey,
    number
  >({
    enabled,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
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
    queryFn: async ({ queryKey: [, { pageSize, address }], pageParam }) => {
      return await fetchTokenActivityFeed({
        address,
        pageParam,
        supabase,
        pageSize,
      })
    },
    refetchInterval: ({ state: { dataUpdateCount, data } }) => {
      const { pages } = data ?? {}
      if (!pages || !pages[0]) return refetchInterval
      const activities = pages.flat()
      const hasPendingTransfer = activities.some(
        (a) =>
          a.event_name === Events.TemporalSendAccountTransfers &&
          !['cancelled', 'failed'].includes(a.data.status)
      )

      if (hasPendingTransfer) {
        if (dataUpdateCount >= MAX_REFETCHES) {
          return refetchInterval // Return to normal interval after max refetches
        }
        return PENDING_TRANSFERS_INTERVAL
      }
      return refetchInterval
    },
  })
}

/**
 * Fetches the activity feed for a specific token address.
 *
 * @param params.pageParam - The page number to fetch
 * @param params.supabase - The Supabase client
 * @param params.pageSize - The number of items to fetch per page
 * @param params.address - The token address to fetch activities for
 */
export async function fetchTokenActivityFeed({
  pageParam,
  supabase,
  pageSize,
  address,
}: {
  pageParam: number
  supabase: SupabaseClient<Database>
  pageSize: number
  address?: PgBytea
}): Promise<Activity[]> {
  const from = pageParam * pageSize
  const to = (pageParam + 1) * pageSize - 1
  let query = supabase.from('activity_feed').select('*')

  if (address) {
    query = query
      .eq('data->>log_addr', address)
      .or(
        `event_name.eq.${Events.SendAccountTransfers},event_name.eq.${Events.TemporalSendAccountTransfers}`
      )
  } else {
    // @todo currently will show transfers that fail validation in eth activity
    // This is because sender is defined but log_addr is null
    query = query
      .not('data->>sender', 'is', null)
      .or(
        `event_name.eq.${Events.SendAccountReceive},event_name.eq.${Events.TemporalSendAccountTransfers}`
      )
  }

  const { data, error } = await query
    .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
    .or(getBaseAddressFilterCondition())
    .order('created_at', { ascending: false })
    .range(from, to)

  throwIf(error)

  // Parse and process the raw data
  return EventArraySchema.parse(data)
}
