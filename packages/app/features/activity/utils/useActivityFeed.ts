import type { Database } from '@my/supabase/database-generated.types'
import { sendtagCheckoutAddress, sendTokenV0LockboxAddress, tokenPaymasterAddress } from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { parseAndProcessActivities } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { pgAddrCondValues } from 'app/utils/pgAddrCondValues'
import { squish } from 'app/utils/strings'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook, type AddressBook } from 'app/utils/useAddressBook'
import type { Activity } from 'app/utils/zod/activity'
import { useMemo } from 'react'
import type { ZodError } from 'zod'

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
  const paymasterAddresses = Object.values(tokenPaymasterAddress)
  const sendtagCheckoutAddresses = Object.values(sendtagCheckoutAddress)
  const sendTokenV0LockboxAddresses = Object.values(sendTokenV0LockboxAddress)
  // ignore certain addresses in the activity feed
  const fromTransferIgnoreValues = pgAddrCondValues(paymasterAddresses) // show fees on send screen instead
  const toTransferIgnoreValues = pgAddrCondValues([
    ...paymasterAddresses, // show fees on send screen instead
    ...sendtagCheckoutAddresses, // shows as Sendtag Registered using a different activity row
    ...sendTokenV0LockboxAddresses, // will instead show the "mint"
  ])

  const from = pageParam * pageSize
  const to = (pageParam + 1) * pageSize - 1
  const request = supabase
    .from('activity_feed')
    .select('*')
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
  const { data, error } = await request
  throwIf(error)
  // Parse and process the raw data
  return parseAndProcessActivities(data, {
    addressBook,
  })
}
