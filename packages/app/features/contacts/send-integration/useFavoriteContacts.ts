/**
 * Hooks for fetching contacts for use in the Send flow.
 *
 * These hooks provide contacts in a format compatible with the Send suggestions UI.
 */

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { CONTACTS_QUERY_KEY } from '../constants'

/** Query key for favorite contacts in send context */
const FAVORITE_CONTACTS_SEND_KEY = [CONTACTS_QUERY_KEY, 'send', 'favorites'] as const

/** Query key for recent contacts in send context */
const RECENT_CONTACTS_SEND_KEY = [CONTACTS_QUERY_KEY, 'send', 'recent'] as const

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
          external_address: contact.external_address,
          chain_id: contact.chain_id,
        }))
    },

    staleTime: 30_000, // 30 seconds
  })
}

// Attach query key for external use
useRecentContacts.queryKey = RECENT_CONTACTS_SEND_KEY
