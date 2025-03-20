import { sendtagCheckoutAddress, sendTokenV0LockboxAddress, tokenPaymasterAddress } from '@my/wagmi'
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
import { EventArraySchema, type Activity } from 'app/utils/zod/activity'
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

  async function fetchActivityFeed({ pageParam }: { pageParam: number }): Promise<Activity[]> {
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

    // Parse the raw data
    const activities = EventArraySchema.parse(data)

    // Process activities if addressBook is available
    if (addressBook.data) {
      return processActivities(activities, addressBook.data)
    }

    return activities
  }

  return useInfiniteQuery({
    queryKey: ['activity_feed'],
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
    queryFn: fetchActivityFeed,
  })
}
