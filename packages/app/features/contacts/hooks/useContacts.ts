import { useMemo } from 'react'
import type { ContactFilter, ContactView } from '../types'
import { useContactSearch } from './useContactSearch'

interface UseContactsOptions {
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
 * Return type for useContacts hook.
 */
export interface UseContactsResult {
  /** Flattened list of all loaded contacts */
  contacts: ContactView[]
  /** Whether the initial page is loading */
  isLoading: boolean
  /** Whether a next page is being fetched */
  isFetchingNextPage: boolean
  /** Whether more pages are available */
  hasNextPage: boolean
  /** Error from the query */
  error: Error | null
  /** Function to fetch the next page */
  fetchNextPage: () => void
  /** Function to refetch all data */
  refetch: () => void
}

/**
 * Wrapper hook providing a simplified interface for accessing contacts.
 *
 * Flattens paginated data and exposes common loading/error states.
 * Use this hook when you need direct access to contacts data without
 * the full query object.
 *
 * @example
 * ```tsx
 * const { contacts, isLoading, hasNextPage, fetchNextPage } = useContacts({
 *   query: searchQuery,
 *   filter: { type: 'favorites' },
 * })
 *
 * return (
 *   <FlatList
 *     data={contacts}
 *     onEndReached={() => hasNextPage && fetchNextPage()}
 *   />
 * )
 * ```
 */
export function useContacts({
  query = '',
  filter = { type: 'all' },
  pageSize,
  enabled = true,
}: UseContactsOptions = {}): UseContactsResult {
  const { data, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } =
    useContactSearch({ query, filter, pageSize, enabled })

  // Flatten paginated data into a single array
  const contacts = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flat()
  }, [data?.pages])

  return {
    contacts,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    error: error as Error | null,
    fetchNextPage,
    refetch,
  }
}
