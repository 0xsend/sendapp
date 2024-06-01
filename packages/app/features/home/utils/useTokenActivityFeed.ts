import type { PgBytea } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import {
  Events,
  SendAccountTransfersEventSchema,
  type SendAccountTransfersEvent,
} from 'app/utils/zod/activity'
import { z, type ZodError } from 'zod'

const SendAccountTransfersEvenArrayySchema = z.array(SendAccountTransfersEventSchema)

/**
 * Infinite query to fetch ERC-20 token activity feed.
 *
 * @note does not support ETH transfers. Need to add another shovel integration to handle ETH receives, and another one for ETH sends
 *
 * @param pageSize - number of items to fetch per page
 */
export function useTokenActivityFeed(params: {
  pageSize?: number
  address: PgBytea
}): UseInfiniteQueryResult<InfiniteData<SendAccountTransfersEvent[]>, PostgrestError | ZodError> {
  const { pageSize = 10, address } = params
  const supabase = useSupabase()

  async function fetchTokenActivityFeed({
    pageParam,
  }: { pageParam: number }): Promise<SendAccountTransfersEvent[]> {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('event_name', Events.SendAccountTransfers)
      .eq('data->>log_addr', address)
      .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
      .order('created_at', { ascending: false })
      .range(from, to)
    throwIf(error)
    return SendAccountTransfersEvenArrayySchema.parse(data)
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
  })
}
