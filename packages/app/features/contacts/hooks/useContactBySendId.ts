import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { CONTACTS_QUERY_KEY } from '../constants'
import type { ContactView } from '../types'

/**
 * Hook to find if a user is in the current user's contacts by their send_id.
 *
 * Uses the contact_by_send_id RPC for efficient direct lookup.
 * Returns the contact info if found, null otherwise.
 * Useful for checking if a user is already a contact or favorite.
 *
 * @example
 * ```tsx
 * const { data: contact, isLoading } = useContactBySendId(profile?.sendid)
 * const isContact = !!contact
 * const isFavorite = contact?.is_favorite
 * ```
 */
export function useContactBySendId(sendId: number | null | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, 'by-sendid', sendId],
    queryFn: async (): Promise<ContactView | null> => {
      if (!sendId) return null

      // Use the direct contact_by_send_id RPC for efficient lookup
      const { data, error } = await supabase.rpc('contact_by_send_id', {
        p_send_id: sendId,
      })

      if (error) {
        throw new Error(error.message)
      }

      // RPC returns a result with all NULL fields if contact not found
      // Check for contact_id to determine if a contact actually exists
      const result = data as ContactView | null
      if (!result?.contact_id) {
        return null
      }

      return result
    },
    enabled: !!sendId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}
