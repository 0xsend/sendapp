import { tokenPaymasterAddress } from '@my/wagmi'
import type { PostgrestError } from '@supabase/postgrest-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema, type Activity } from 'app/utils/zod/activity'
import type { ZodError } from 'zod'

/**
 * Infinite query to fetch activity feed. Filters out activities with no from or to user (not a send app user).
 * @param pageSize - number of items to fetch per page
 */
export function useActivityFeed({
  pageSize = 10,
}: { pageSize?: number } = {}): UseInfiniteQueryResult<
  InfiniteData<Activity[]>,
  PostgrestError | ZodError
> {
  const supabase = useSupabase()
  async function fetchActivityFeed({ pageParam }: { pageParam: number }): Promise<Activity[]> {
    const pgPaymasterCondValues = Object.values(tokenPaymasterAddress)
      .map((a) => `${hexToBytea(a)}`)
      .join(',')

    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const request = supabase
      .from('activity_feed')
      .select('*')
      .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
      .or(
        // filter out paymaster fees for gas
        `data->t.is.null, data->f.is.null, and(data->>t.not.in.(${pgPaymasterCondValues}), data->>f.not.in.(${pgPaymasterCondValues}))`
      )
      .order('created_at', { ascending: false })
      .range(from, to)
    const { data, error } = await request
    throwIf(error)
    return EventArraySchema.parse(data)
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
