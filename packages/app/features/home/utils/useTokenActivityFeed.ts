import type { PgBytea } from '@my/supabase/database.types'
import { sendTokenV0LockboxAddress, tokenPaymasterAddress } from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { processActivities } from 'app/utils/activity'
import { pgAddrCondValues } from 'app/utils/pgAddrCondValues'
import { squish } from 'app/utils/strings'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook } from 'app/utils/useAddressBook'
import { EventArraySchema, Events, type Activity } from 'app/utils/zod/activity'
import { useRef } from 'react'
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
  const { pageSize = 10, address, refetchInterval = 30_000, enabled = true } = params
  const supabase = useSupabase()
  const refetchCount = useRef(0)
  const addressBook = useAddressBook()

  async function fetchTokenActivityFeed({ pageParam }: { pageParam: number }): Promise<Activity[]> {
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

    // Parse the raw data
    const activities = EventArraySchema.parse(data)

    // Process activities if addressBook is available
    if (addressBook.data) {
      return processActivities(activities, addressBook.data)
    }

    return activities
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
    refetchInterval: ({ state: { data } }) => {
      const { pages } = data ?? {}
      if (!pages || !pages[0]) return refetchInterval
      const activities = pages.flat()
      const hasPendingTransfer = activities.some(
        (a) =>
          a.event_name === Events.TemporalSendAccountTransfers &&
          !['cancelled', 'failed'].includes(a.data.status)
      )

      if (hasPendingTransfer) {
        if (refetchCount.current >= MAX_REFETCHES) {
          return refetchInterval // Return to normal interval after max refetches
        }
        refetchCount.current += 1
        return PENDING_TRANSFERS_INTERVAL
      }

      // Reset refetch count when there are no pending transfers
      refetchCount.current = 0
      return refetchInterval
    },
    enabled,
  })
}
