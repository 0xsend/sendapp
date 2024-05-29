import { useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { EventArraySchema } from 'app/utils/zod/activity'

/**
 * Infinite query to fetch activity feed. Filters out activities with no from or to user (not a send app user).
 * @param pageSize - number of items to fetch per page
 */
export function useActivityFeed({ pageSize = 10 }: { pageSize?: number } = {}) {
  const supabase = useSupabase()
  async function fetchActivityFeed({ pageParam }: { pageParam: number }) {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .or('from_user.not.is.null, to_user.not.is.null') // only show activities with a send app user
      .order('created_at', { ascending: false })
      .range(from, to)
    throwIf(error)
    const result = EventArraySchema.safeParse(data)
    if (result.success) {
      return result.data
    }
    console.error('Error parsing activity feed', result.error)
    return result.error.issues.map((issue) => issue.message).join(', ')
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
