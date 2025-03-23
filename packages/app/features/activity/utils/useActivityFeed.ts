import type { Database } from '@my/supabase/database-generated.types'
import { sendtagCheckoutAddress } from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { getBaseAddressFilterCondition, parseAndProcessActivities } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook, type AddressBook } from 'app/utils/useAddressBook'
import { DatabaseEvents, type Activity } from 'app/utils/zod/activity'
import { useMemo } from 'react'
import type { ZodError } from 'zod'

const sendtagCheckoutAddresses = Object.values(sendtagCheckoutAddress)

/**
 * Infinite query to fetch activity feed. Filters out activities with no from or to user (not a send app user).
 * Processes activities to handle special cases like Send Earn deposits.
 *
 * @param pageSize - number of items to fetch per page
 */
export function useActivityFeed({
  pageSize = 10,
}: { pageSize?: number } = {}): UseInfiniteQueryResult<
  InfiniteData<Activity[]>,
  PostgrestError | ZodError
> {
  const supabase = useSupabase()
  const addressBook = useAddressBook()
  const enabled = useMemo(() => addressBook.isError || addressBook.isSuccess, [addressBook])
  const queryKey = useMemo(
    () => ['activity_feed', { addressBook, supabase, pageSize }] as const,
    [addressBook, supabase, pageSize]
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
    queryFn: async ({ queryKey: [, { addressBook, supabase, pageSize }], pageParam }) => {
      throwIf(addressBook.error)
      assert(!!addressBook.data, 'Fetching address book failed')
      return await fetchActivityFeed({
        pageParam,
        supabase,
        pageSize,
        addressBook: addressBook.data,
      })
    },
  })
}

/**
 * Fetches the activity feed for the current user.
 *
 * @param params.pageParam - The page number to fetch
 * @param params.addressBook - The address book containing known addresses and their labels
 * @param params.supabase - The Supabase client
 * @param params.pageSize - The number of items to fetch per page
 */
async function fetchActivityFeed({
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

  const request = supabase
    .from('activity_feed')
    .select('*')
    .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
    .or(getBaseAddressFilterCondition(sendtagCheckoutAddresses)) // shows as Sendtag Registered using a different activity row
    .not(
      'event_name',
      'in',
      // exclude Send Earn deposits and withdrawals from the feed (they show up as SendAccountTransfers)
      `(${[DatabaseEvents.SendEarnDeposit, DatabaseEvents.SendEarnWithdraw].join(',')})`
    )
    .order('created_at', { ascending: false })
    .range(from, to)
  const { data, error } = await request
  throwIf(error)
  // Parse and process the raw data
  return parseAndProcessActivities(data, {
    addressBook,
  })
}
