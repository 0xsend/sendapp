import { useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'

const QUERY_KEY = 'friends_feed'

/**
 * Infinite query to fetch friends
 * @param pageSize - number of items to fetch per page
 */
export function useFriendsFeed({ pageSize = 10 }: { pageSize?: number } = {}) {
  const supabase = useSupabase()
  async function fetchFriends({ pageParam }: { pageParam: number }) {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const request = supabase.rpc('get_friends').select('*').range(from, to)
    const { data, error } = await request
    throwIf(error)
    return data
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
    queryFn: fetchFriends,
  })
}

useFriendsFeed.queryKey = QUERY_KEY
