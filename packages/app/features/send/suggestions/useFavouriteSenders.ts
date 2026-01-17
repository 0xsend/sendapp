import { useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { UserSchema } from 'app/utils/zod/activity/UserSchema'
import { z } from 'zod'
import type { SendSuggestionsQueryResult } from 'app/features/send/suggestions/SendSuggestion.types'

const QUERY_KEY = 'favourite_senders'

/**
 * Infinite query to fetch favourite senders
 * @param pageSize - number of items to fetch per page
 * @param enabled - whether the query should run (default: true)
 */
export const useFavouriteSenders = ({
  pageSize = 10,
  enabled = true,
}: { pageSize?: number; enabled?: boolean } = {}): SendSuggestionsQueryResult => {
  const supabase = useSupabase()

  async function fetchFavouriteSenders({ pageParam }: { pageParam: number }) {
    const { data, error } = await supabase.rpc('favourite_senders', {
      page_number: pageParam,
      page_size: pageSize,
    })

    if (error || !data) {
      throw new Error(error?.message || 'Unable to fetch favourite senders')
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
    queryFn: fetchFavouriteSenders,
    retry: false,
    enabled,
  })
}

useFavouriteSenders.queryKey = QUERY_KEY
