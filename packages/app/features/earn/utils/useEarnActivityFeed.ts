import type { Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { getBaseAddressFilterCondition, parseAndProcessActivities } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook, type AddressBook } from 'app/utils/useAddressBook'
import { DatabaseEvents, type Activity } from 'app/utils/zod/activity'
import { useMemo } from 'react'
import type { ZodError } from 'zod'

/**
 * Infinite query to fetch Send Earn activity feed.
 * Uses the client-side processing to identify Send Earn deposits and withdrawals.
 *
 * @param params.pageSize - Number of items to fetch per page
 * @param params.refetchInterval - Interval in ms to refetch data
 * @param params.enabled - Whether the query is enabled
 */
export function useEarnActivityFeed(params?: {
  pageSize?: number
  refetchInterval?: number
  enabled?: boolean
}): UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError> {
  const { pageSize = 10, refetchInterval = 30_000, enabled: enabledProp = true } = params ?? {}
  const supabase = useSupabase()
  const addressBook = useAddressBook()
  const sendAccount = useSendAccount()

  const enabled = useMemo(
    () => enabledProp && (addressBook.isError || addressBook.isSuccess) && sendAccount.isSuccess,
    [enabledProp, addressBook, sendAccount]
  )

  const queryKey = useMemo(
    () => ['earn_activity_feed', { addressBook, supabase, pageSize, sendAccount }] as const,
    [addressBook, supabase, pageSize, sendAccount]
  )

  return useInfiniteQuery<
    Activity[],
    PostgrestError | ZodError,
    InfiniteData<Activity[], number>,
    typeof queryKey,
    number
  >({
    enabled,
    queryKey,
    refetchInterval,
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
    queryFn: async ({
      queryKey: [, { addressBook, supabase, pageSize, sendAccount }],
      pageParam,
    }) => {
      throwIf(addressBook.error)
      throwIf(sendAccount.error)
      assert(!!addressBook.data, 'Fetching address book failed')
      assert(!!sendAccount.data, 'Fetching send account failed')

      return await fetchEarnActivityFeed({
        pageParam,
        supabase,
        pageSize,
        addressBook: addressBook.data,
      })
    },
  })
}

/**
 * Fetches the Send Earn activity feed for the current user.
 * This queries the activity_feed view with filters to identify Send Earn related activities.
 */
async function fetchEarnActivityFeed({
  pageParam,
  addressBook,
  supabase,
  pageSize,
}: {
  pageParam: number
  addressBook: AddressBook
  supabase: SupabaseClient<Database>
  pageSize: number
}): Promise<Activity[]> {
  const from = pageParam * pageSize
  const to = (pageParam + 1) * pageSize - 1

  // Query for Send Earn activity
  const query = supabase
    .from('activity_feed')
    .select('*')
    .or(
      `event_name.eq.${DatabaseEvents.SendEarnDeposit},event_name.eq.${DatabaseEvents.SendEarnWithdraw}`
    )
    // Apply base address filtering
    .or(getBaseAddressFilterCondition())
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error } = await query
  throwIf(error)

  // Parse and process the raw data
  return parseAndProcessActivities(data, {
    addressBook,
  })
}
