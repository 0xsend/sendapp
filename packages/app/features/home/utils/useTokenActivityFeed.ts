import type { Database, PgBytea } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { getBaseAddressFilterCondition } from 'app/utils/activity'
import { parseAndProcessActivities } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook, type AddressBook } from 'app/utils/useAddressBook'
import { DatabaseEvents, type Activity } from 'app/utils/zod/activity'
import { useMemo } from 'react'
import type { ZodError } from 'zod'

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
  const addressBook = useAddressBook()
  const enabled = useMemo(
    () => enabledProp && (addressBook.isError || addressBook.isSuccess),
    [enabledProp, addressBook]
  )
  const queryKey = useMemo(
    () => ['token_activity_feed', { addressBook, supabase, pageSize, address }] as const,
    [addressBook, supabase, pageSize, address]
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
    queryFn: async ({ queryKey: [, { addressBook, supabase, pageSize, address }], pageParam }) => {
      throwIf(addressBook.error)
      assert(!!addressBook.data, 'Fetching address book failed')
      return await fetchTokenActivityFeed({
        address,
        pageParam,
        supabase,
        pageSize,
        addressBook: addressBook.data,
      })
    },
  })
}

/**
 * Fetches the activity feed for a specific token address.
 *
 * @param params.pageParam - The page number to fetch
 * @param params.addressBook - The address book containing known addresses and their labels
 * @param params.supabase - The Supabase client
 * @param params.pageSize - The number of items to fetch per page
 * @param params.address - The token address to fetch activities for
 */
export async function fetchTokenActivityFeed({
  pageParam,
  addressBook,
  supabase,
  pageSize,
  address,
}: {
  pageParam: number
  addressBook: AddressBook
  supabase: SupabaseClient<Database>
  pageSize: number
  address?: PgBytea
}): Promise<Activity[]> {
  const from = pageParam * pageSize
  const to = (pageParam + 1) * pageSize - 1
  let query = supabase.from('activity_feed').select('*')

  if (address) {
    query = query
      .eq('event_name', DatabaseEvents.SendAccountTransfers)
      .eq('data->>log_addr', address)
  } else {
    query = query.eq('event_name', DatabaseEvents.SendAccountReceive)
  }

  const { data, error } = await query
    .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
    .or(getBaseAddressFilterCondition())
    .order('created_at', { ascending: false })
    .range(from, to)
  throwIf(error)

  // Parse and process the raw data
  return parseAndProcessActivities(data, {
    addressBook,
  })
}
