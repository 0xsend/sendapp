import { useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'

/**
 * Infinite query to fetch referrals
 * @param pageSize - number of items to fetch per page
 */
export function useAffiliateReferrals({ pageSize = 10 }: { pageSize?: number } = {}) {
  const supabase = useSupabase()
  async function fetchAffiliateReferrals({ pageParam }: { pageParam: number }) {
    const from = pageParam * pageSize
    const to = (pageParam + 1) * pageSize - 1
    const request = supabase.rpc('get_affiliate_referrals').select('*').range(from, to)
    const { data, error } = await request
    throwIf(error)
    return data
  }
  return useInfiniteQuery({
    queryKey: ['affiliate_referrals'],
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
    queryFn: fetchAffiliateReferrals,
  })
}
