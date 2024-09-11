import { tokenPaymasterAddress } from '@my/wagmi'
import { useInfiniteQuery } from '@tanstack/react-query'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import { usePendingTransfers } from './usePendingTransfers'
import type { Address } from 'viem'
import type { coins } from 'app/data/coins'

/**
 * Returns two hooks
 * 1. useTokenActivityFeed - Infinite query to fetch ERC-20 token activity feed.
 * 2. usePendingTransfers - Returns a list from temporal of pending transfers for the given address and token
 *
 * @note does not support ETH transfers. Need to add another shovel integration to handle ETH receives, and another one for ETH sends
 *
 * @param pageSize - number of items to fetch per page
 */
export function useTokenActivityFeed(params: {
  pageSize?: number
  address: Address
  token: coins[number]['token']
  refetchInterval?: number
  enabled?: boolean
}) {
  const { pageSize = 10, token, address, refetchInterval = 30_000, enabled = true } = params
  const supabase = useSupabase()

  async function fetchTokenActivityFeed({ pageParam }: { pageParam: number }): Promise<Activity[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    let query = supabase.from('activity_feed').select('*')
    const logAddress = token === 'eth' ? undefined : hexToBytea(token)
    if (logAddress) {
      query = query.eq('event_name', Events.SendAccountTransfers).eq('data->>log_addr', logAddress)
    } else {
      query = query.eq('event_name', Events.SendAccountReceive)
    }

    const pgPaymasterCondValues = Object.values(tokenPaymasterAddress)
      .map((a) => `${hexToBytea(a)}`)
      .join(',')

    const { data, error } = await query
      .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
      .or(
        // Filter out paymaster fees for gas
        `data->t.is.null, data->f.is.null, and(data->>t.not.in.(${pgPaymasterCondValues}), data->>f.not.in.(${pgPaymasterCondValues}))`
      )
      .order('created_at', { ascending: false })
      .range(from, to)
    throwIf(error)
    return EventArraySchema.parse(data)
  }

  return {
    pendingTransfers: usePendingTransfers({
      address: address,
      token,
      refetchInterval,
      enabled,
    }),
    activityFeed: useInfiniteQuery({
      queryKey: ['token_activity_feed', token],
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
      queryFn: fetchTokenActivityFeed,
      refetchInterval,
      enabled,
    }),
  }
}
