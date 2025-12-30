import type { PostgrestError } from '@supabase/supabase-js'
import { useDebounce } from '@my/ui'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CONTACTS_SEARCH_DEBOUNCE_MS } from './constants'
import { useContacts } from './hooks/useContacts'
import type {
  ContactBookActions,
  ContactBookContextValue,
  ContactBookState,
  ContactFilter,
  ContactView,
} from './types'

/**
 * Extended context value including contacts data and query controls.
 */
interface ContactBookContextValueExtended extends ContactBookContextValue {
  /** List of loaded contacts */
  contacts: ContactView[]
  /** Whether more contacts are available to load */
  hasNextPage: boolean
  /** Whether a next page is being fetched */
  isFetchingNextPage: boolean
  /** Fetch the next page of contacts */
  fetchNextPage: () => void
  /** Refetch all contacts */
  refetch: () => void
}

const ContactBookContext = createContext<ContactBookContextValueExtended | null>(null)

interface ContactBookProviderProps {
  children: React.ReactNode
  /** Initial filter to apply */
  initialFilter?: ContactFilter
}

/**
 * Provider for contact book functionality.
 *
 * Manages search state and debouncing. Request cancellation is handled
 * automatically by React Query when the query key changes.
 *
 * @example
 * ```tsx
 * function ContactsScreen() {
 *   return (
 *     <ContactBookProvider>
 *       <ContactSearchInput />
 *       <ContactList />
 *     </ContactBookProvider>
 *   )
 * }
 * ```
 */
/**
 * Serializes a ContactFilter for comparison purposes.
 */
function serializeFilter(filter: ContactFilter): string {
  switch (filter.type) {
    case 'label':
      return `label:${filter.labelId}`
    case 'source':
      return `source:${filter.source}`
    default:
      return filter.type
  }
}

export function ContactBookProvider({
  children,
  initialFilter = { type: 'all' },
}: ContactBookProviderProps) {
  // Search state
  const [inputQuery, setInputQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<ContactFilter>(initialFilter)

  // Sync filter when initialFilter changes (e.g., URL param changes)
  // Use a ref to track the previous initialFilter to detect actual changes
  const prevInitialFilterKey = useRef(serializeFilter(initialFilter))
  useEffect(() => {
    const newKey = serializeFilter(initialFilter)
    if (prevInitialFilterKey.current !== newKey) {
      prevInitialFilterKey.current = newKey
      setFilter(initialFilter)
    }
  }, [initialFilter])

  // Debounced search handler
  const handleDebouncedSearch = useDebounce(
    (query: string) => {
      setDebouncedQuery(query)
    },
    CONTACTS_SEARCH_DEBOUNCE_MS,
    { leading: false },
    []
  )

  // Cancel pending debounce when query is cleared
  useEffect(() => {
    if (inputQuery.length === 0) {
      handleDebouncedSearch.cancel()
      setDebouncedQuery('')
    } else {
      handleDebouncedSearch(inputQuery)
    }
  }, [inputQuery, handleDebouncedSearch])

  // Fetch contacts with the debounced query
  const { contacts, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } =
    useContacts({
      query: debouncedQuery,
      filter,
      enabled: true,
    })

  // Actions
  const setQuery = useCallback((query: string) => {
    setInputQuery(query)
  }, [])

  const clearSearch = useCallback(() => {
    setInputQuery('')
    setDebouncedQuery('')
    setFilter({ type: 'all' })
    handleDebouncedSearch.cancel()
  }, [handleDebouncedSearch])

  const handleSetFilter = useCallback((newFilter: ContactFilter) => {
    setFilter(newFilter)
  }, [])

  // Build context value
  const contextValue = useMemo<ContactBookContextValueExtended>(
    () => ({
      // State
      query: inputQuery,
      filter,
      isLoading,
      error: error as PostgrestError | null,

      // Contacts data
      contacts,
      hasNextPage,
      isFetchingNextPage,

      // Actions
      setQuery,
      setFilter: handleSetFilter,
      clearSearch,
      fetchNextPage,
      refetch,
    }),
    [
      inputQuery,
      filter,
      isLoading,
      error,
      contacts,
      hasNextPage,
      isFetchingNextPage,
      setQuery,
      handleSetFilter,
      clearSearch,
      fetchNextPage,
      refetch,
    ]
  )

  return <ContactBookContext.Provider value={contextValue}>{children}</ContactBookContext.Provider>
}

/**
 * Hook to access the contact book context.
 *
 * Must be used within a ContactBookProvider.
 *
 * @example
 * ```tsx
 * function ContactSearchInput() {
 *   const { query, setQuery, clearSearch } = useContactBook()
 *
 *   return (
 *     <Input
 *       value={query}
 *       onChangeText={setQuery}
 *       onClear={clearSearch}
 *     />
 *   )
 * }
 * ```
 */
export function useContactBook(): ContactBookContextValueExtended {
  const context = useContext(ContactBookContext)

  if (!context) {
    throw new Error('useContactBook must be used within a ContactBookProvider')
  }

  return context
}
