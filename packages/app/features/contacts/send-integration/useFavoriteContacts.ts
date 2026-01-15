/**
 * Hooks for fetching contacts for use in the Send flow.
 *
 * These hooks provide contacts in a format compatible with the Send suggestions UI.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { CONTACTS_QUERY_KEY } from '../constants'

/** Query key for favorite contacts in send context */
const FAVORITE_CONTACTS_SEND_KEY = [CONTACTS_QUERY_KEY, 'send', 'favorites'] as const

/** Query key for recent contacts in send context */
const RECENT_CONTACTS_SEND_KEY = [CONTACTS_QUERY_KEY, 'send', 'recent'] as const

/** Query key for all contacts in send context (single row) */
const SEND_PAGE_CONTACTS_KEY = [CONTACTS_QUERY_KEY, 'send', 'page'] as const

/**
 * Contact item formatted for the Send flow.
 */
export interface SendContactItem {
  /** Contact ID */
  contact_id: number
  /** Send ID (if a Send user) */
  send_id: number | null
  /** Main sendtag name (if available) */
  main_tag_name: string | null
  /** All tags */
  tags: string[] | null
  /** Profile name */
  name: string | null
  /** Avatar URL */
  avatar_url: string | null
  /** Whether verified */
  is_verified: boolean
  /** Whether this contact is a favorite */
  is_favorite: boolean
  /** External address (if external contact) */
  external_address: string | null
  /** Chain ID for external contacts */
  chain_id: string | null
}

/**
 * Hook to fetch favorite contacts for the Send flow.
 *
 * Returns contacts marked as favorites that can be used as send recipients.
 *
 * @example
 * ```tsx
 * const { data: favoriteContacts } = useFavoriteContacts()
 *
 * return favoriteContacts?.map(contact => (
 *   <ContactSuggestion key={contact.contact_id} contact={contact} />
 * ))
 * ```
 */
export function useFavoriteContacts() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: FAVORITE_CONTACTS_SEND_KEY,

    async queryFn(): Promise<SendContactItem[]> {
      const { data, error } = await supabase.rpc('contact_search', {
        p_query: undefined,
        p_favorites_only: true,
        p_label_ids: undefined,
        p_source_filter: undefined,
        p_limit_val: 20,
        p_offset_val: 0,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Transform contacts to SendContactItem format, filtering out any with null contact_id
      return (data ?? [])
        .filter(
          (contact): contact is typeof contact & { contact_id: number } =>
            contact.contact_id !== null
        )
        .map((contact) => ({
          contact_id: contact.contact_id,
          send_id: contact.send_id,
          main_tag_name: contact.main_tag_name,
          tags: contact.tags,
          name: contact.custom_name ?? contact.profile_name,
          avatar_url: contact.avatar_url,
          is_verified: contact.is_verified ?? false,
          is_favorite: contact.is_favorite ?? false,
          external_address: contact.external_address,
          chain_id: contact.chain_id,
        }))
    },

    staleTime: 30_000, // 30 seconds
  })
}

// Attach query key for external use
useFavoriteContacts.queryKey = FAVORITE_CONTACTS_SEND_KEY

/**
 * Hook to fetch recent contacts for the Send flow.
 *
 * Returns the most recently added/interacted contacts (excluding favorites
 * to avoid duplication with the favorites section).
 *
 * @example
 * ```tsx
 * const { data: recentContacts } = useRecentContacts()
 *
 * return recentContacts?.map(contact => (
 *   <ContactSuggestion key={contact.contact_id} contact={contact} />
 * ))
 * ```
 */
export function useRecentContacts() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: RECENT_CONTACTS_SEND_KEY,

    async queryFn(): Promise<SendContactItem[]> {
      // Fetch all contacts ordered by recency (default order from contact_search)
      const { data, error } = await supabase.rpc('contact_search', {
        p_query: undefined,
        p_favorites_only: false,
        p_label_ids: undefined,
        p_source_filter: undefined,
        p_limit_val: 10,
        p_offset_val: 0,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Filter out favorites to avoid duplication with favorites section
      // and transform to SendContactItem format
      return (data ?? [])
        .filter(
          (contact): contact is typeof contact & { contact_id: number } =>
            contact.contact_id !== null && !contact.is_favorite
        )
        .slice(0, 8)
        .map((contact) => ({
          contact_id: contact.contact_id,
          send_id: contact.send_id,
          main_tag_name: contact.main_tag_name,
          tags: contact.tags,
          name: contact.custom_name ?? contact.profile_name,
          avatar_url: contact.avatar_url,
          is_verified: contact.is_verified ?? false,
          is_favorite: contact.is_favorite ?? false,
          external_address: contact.external_address,
          chain_id: contact.chain_id,
        }))
    },

    staleTime: 30_000, // 30 seconds
  })
}

// Attach query key for external use
useRecentContacts.queryKey = RECENT_CONTACTS_SEND_KEY

/**
 * Hook to fetch contacts for the Send page with infinite scroll/pagination.
 *
 * Returns contacts sorted by last_interacted_at (most recent transactions first),
 * with contacts that have no transaction history sorted by creation date at the end.
 * Supports pagination with 10 contacts per page.
 *
 * Note: The contact_search function already sorts by last_interacted_at DESC NULLS LAST,
 * which naturally puts contacts without transactions at the end.
 *
 * @example
 * ```tsx
 * const { data, hasNextPage, fetchNextPage } = useSendPageContacts()
 *
 * return (
 *   <>
 *     {data?.pages.map((page, i) => (
 *       <FlatList
 *         key={i}
 *         horizontal
 *         data={page}
 *         renderItem={({ item }) => <ContactSuggestion contact={item} />}
 *       />
 *     ))}
 *     {hasNextPage && <Button onPress={fetchNextPage}>View More</Button>}
 *   </>
 * )
 * ```
 */
export function useSendPageContacts({ pageSize = 10 }: { pageSize?: number } = {}) {
  const supabase = useSupabase()

  async function fetchContacts({ pageParam }: { pageParam: number }): Promise<SendContactItem[]> {
    // Fetch contacts sorted purely by last_interacted_at (no favorites priority)
    // p_sort_by_recency_only=true removes the is_favorite DESC from ORDER BY
    const { data, error } = await supabase.rpc('contact_search', {
      p_query: undefined,
      p_favorites_only: false,
      p_label_ids: undefined,
      p_source_filter: undefined,
      p_limit_val: pageSize,
      p_offset_val: pageParam * pageSize,
      p_sort_by_recency_only: true,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Transform contacts to SendContactItem format, filtering out any with null contact_id
    return (data ?? [])
      .filter(
        (contact): contact is typeof contact & { contact_id: number } => contact.contact_id !== null
      )
      .map((contact) => ({
        contact_id: contact.contact_id,
        send_id: contact.send_id,
        main_tag_name: contact.main_tag_name,
        tags: contact.tags,
        name: contact.custom_name ?? contact.profile_name,
        avatar_url: contact.avatar_url,
        is_verified: contact.is_verified ?? false,
        is_favorite: contact.is_favorite ?? false,
        external_address: contact.external_address,
        chain_id: contact.chain_id,
      }))
  }

  return useInfiniteQuery({
    queryKey: SEND_PAGE_CONTACTS_KEY,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If we got fewer items than requested, there are no more pages
      if (lastPage === null || lastPage.length < pageSize) return undefined
      return lastPageParam + 1
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      if (firstPageParam <= 0) return undefined
      return firstPageParam - 1
    },
    queryFn: fetchContacts,
    staleTime: 30_000, // 30 seconds
  })
}

// Attach query key for external use
useSendPageContacts.queryKey = SEND_PAGE_CONTACTS_KEY
