import { useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { UserSchema } from 'app/utils/zod/activity/UserSchema'
import { z } from 'zod'
import type { SendSuggestionsQueryResult } from 'app/features/send/suggestions/SendSuggestion.types'

const QUERY_KEY = 'today_birthday_senders'

/**
 * Infinite query to fetch today's birthday senders
 * @param pageSize - number of items to fetch per page
 * @param enabled - whether the query should run (default: true)
 */
export const useTodayBirthdaySenders = ({
  pageSize = 10,
  enabled = true,
}: { pageSize?: number; enabled?: boolean } = {}): SendSuggestionsQueryResult => {
  const supabase = useSupabase()

  async function fetchTodayBirthdaySenders({ pageParam }: { pageParam: number }) {
    const { data, error } = await supabase.rpc('today_birthday_senders', {
      page_number: pageParam,
      page_size: pageSize,
    })

    if (error || !data) {
      throw new Error(error?.message || 'Unable to fetch today birthday senders')
    }

    return z.array(UserSchema).parse(data)
  }

  return useInfiniteQuery({
    queryKey: [QUERY_KEY],
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
    queryFn: fetchTodayBirthdaySenders,
    retry: false,
    enabled,
  })
}

useTodayBirthdaySenders.queryKey = QUERY_KEY
