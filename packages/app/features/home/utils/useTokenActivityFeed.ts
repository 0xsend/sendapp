import { sendTokenV0LockboxAddress, tokenPaymasterAddress } from '@my/wagmi'
import { useInfiniteQuery } from '@tanstack/react-query'
import { pgAddrCondValues } from 'app/utils/pgAddrCondValues'
import { squish } from 'app/utils/strings'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import { usePendingTransfers } from './usePendingTransfers'
import type { Address } from 'viem'
import type { allCoins } from 'app/data/coins'

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
  token: allCoins[number]['token']
  refetchInterval?: number
  enabled?: boolean
}) {
  const { pageSize = 10, token, address, refetchInterval = 30_000, enabled = true } = params
  const supabase = useSupabase()

  async function fetchTokenActivityFeed({ pageParam }: { pageParam: number }): Promise<Activity[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    let query = supabase.from('activity_feed').select('*')

    if (address) {
      query = query.eq('event_name', Events.SendAccountTransfers).eq('data->>log_addr', address)
    } else {
      query = query.eq('event_name', Events.SendAccountReceive)
    }

    const paymasterAddresses = Object.values(tokenPaymasterAddress)
    const sendTokenV0LockboxAddresses = Object.values(sendTokenV0LockboxAddress)
    // ignore certain addresses in the activity feed
    const fromTransferIgnoreValues = pgAddrCondValues(paymasterAddresses) // show fees on send screen instead
    const toTransferIgnoreValues = pgAddrCondValues([
      ...paymasterAddresses, // show fees on send screen instead
      ...sendTokenV0LockboxAddresses, // will instead show the "mint"
    ])

    const { data, error } = await query
      .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
      .or(
        squish(`
          data->t.is.null,
          data->f.is.null,
          and(
            data->>t.not.in.(${toTransferIgnoreValues}),
            data->>f.not.in.(${fromTransferIgnoreValues})
          )`)
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
