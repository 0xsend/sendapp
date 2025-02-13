import type { PgBytea } from '@my/supabase/database.types'
import { sendTokenV0LockboxAddress, tokenPaymasterAddress } from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { hexToBytea } from 'app/utils/hexToBytea'
import { pgAddrCondValues } from 'app/utils/pgAddrCondValues'
import { useSendAccount } from 'app/utils/send-accounts'
import { squish } from 'app/utils/strings'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import type { ZodError } from 'zod'

/**
 * Infinite query to fetch ERC-20 token activity feed.
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
  const { pageSize = 10, address, refetchInterval = 30_000, enabled = true } = params
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()
  const senderBytea = sendAccount?.address ? hexToBytea(sendAccount.address) : null

  async function fetchTokenActivityFeed({ pageParam }: { pageParam: number }): Promise<Activity[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    let query = supabase.from('activity_feed').select('*')

    if (address) {
      query = query
        .eq('data->>log_addr', address)
        .or(
          `event_name.eq.${Events.SendAccountTransfers},and(event_name.eq.${Events.TemporalSendAccountTransfers},data->>f.eq.${senderBytea})`
        )
    } else {
      query = query.or(
        `event_name.eq.${Events.SendAccountReceive},and(event_name.eq.${Events.TemporalSendAccountTransfers},data->>sender.eq.${senderBytea})`
      )
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

  return useInfiniteQuery({
    queryKey: ['token_activity_feed', address],
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
  })
}
