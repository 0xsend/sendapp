import { api } from 'app/utils/api'

/**
/**
 * Infinite query to fetch referrals
 * @param pageSize - number of items to fetch per page
 */
export function useReferrals({ pageSize = 10 }: { pageSize?: number } = {}) {
  return api.affiliate.getReferrals.useInfiniteQuery(
    { limit: pageSize },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        if (lastPage !== null && lastPage.length < pageSize) return undefined
        return lastPageParam ? lastPageParam + 1 : 1
      },
      getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
        if (firstPageParam && firstPageParam <= 1) {
          return undefined
        }
        return firstPageParam ? firstPageParam - 1 : 0
      },
    }
  )
}
