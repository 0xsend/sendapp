import { useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { CONTACTS_PAGE_SIZE, CONTACTS_QUERY_KEY } from '../constants'
import type { ContactFilter, ContactSearchParams, ContactSource, ContactView } from '../types'

/**
 * Build query key for contact search queries.
 * Includes query string and filter for proper cache invalidation.
 */
export function contactSearchQueryKey(query: string, filter: ContactFilter) {
  return [CONTACTS_QUERY_KEY, 'search', { query, filter }] as const
}

interface UseContactSearchOptions {
  /** Search query string */
  query?: string
  /** Filter for the search */
  filter?: ContactFilter
  /** Number of items per page */
  pageSize?: number
  /** Whether the query is enabled */
  enabled?: boolean
}

/**
 * Hook for searching contacts with infinite pagination.
 *
 * Uses React Query's useInfiniteQuery with offset-based pagination.
 * Supports abort signal for request cancellation.
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useContactSearch({
 *   query: 'alice',
 *   filter: { type: 'favorites' },
 * })
 * ```
 */
export function useContactSearch({
  query = '',
  filter = { type: 'all' },
  pageSize = CONTACTS_PAGE_SIZE,
  enabled = true,
}: UseContactSearchOptions = {}) {
  const supabase = useSupabase()

  return useInfiniteQuery({
    queryKey: contactSearchQueryKey(query, filter),
    initialPageParam: 0,

    queryFn: async ({ pageParam, signal }) => {
      // Build RPC parameters matching the contact_search function signature
      const params: ContactSearchParams = {
        p_query: query.trim() || undefined,
        p_limit_val: pageSize,
        p_offset_val: pageParam,
      }

      // Add filter parameters based on filter type
      switch (filter.type) {
        case 'favorites':
          params.p_favorites_only = true
          break
        case 'label':
          params.p_label_ids = [filter.labelId]
          break
        case 'source':
          params.p_source_filter = [filter.source as ContactSource]
          break
        default:
          // No additional filters needed for 'all'
          break
      }

      const { data, error } = await supabase.rpc('contact_search', params).abortSignal(signal)

      if (error) {
        // Handle abort errors gracefully
        if (error.message.includes('user aborted') || error.message.includes('AbortError')) {
          return [] as ContactView[]
        }
        throw error
      }

      return (data ?? []) as ContactView[]
    },

    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If we got fewer items than the page size, there are no more pages
      if (lastPage.length < pageSize) {
        return undefined
      }
      // Return the next offset
      return lastPageParam + pageSize
    },

    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      // Can't go before the first page
      if (firstPageParam <= 0) {
        return undefined
      }
      return firstPageParam - pageSize
    },

    enabled,
    retry: false,
    staleTime: 30_000, // Consider data stale after 30 seconds
  })
}

// Attach static query key builder for external use
useContactSearch.queryKey = contactSearchQueryKey
