import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { CONTACTS_QUERY_KEY } from '../constants'
import type { ContactView } from '../types'

/**
 * Hook to find if an external address is in the current user's contacts.
 *
 * Queries the contacts table by normalized_external_address for efficient lookup.
 * Returns the contact info if found, null otherwise.
 *
 * @param externalAddress - The external wallet address (0x...)
 * @param chainId - Optional chain ID (defaults to 'eip155:8453' for Base mainnet)
 *
 * @example
 * ```tsx
 * const { data: contact, isLoading } = useContactByExternalAddress('0x1234...')
 * const isContact = !!contact
 * const isFavorite = contact?.is_favorite
 * ```
 */
export function useContactByExternalAddress(
  externalAddress: string | null | undefined,
  chainId = 'eip155:8453'
) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, 'by-external-address', externalAddress, chainId],
    queryFn: async (): Promise<ContactView | null> => {
      if (!externalAddress) return null

      // Normalize the address (lowercase for consistent matching)
      const normalizedAddress = externalAddress.toLowerCase()

      // Query contacts table by normalized_external_address
      const { data, error } = await supabase
        .from('contacts')
        .select(
          `
          id,
          owner_id,
          custom_name,
          notes,
          is_favorite,
          source,
          last_interacted_at,
          created_at,
          updated_at,
          archived_at,
          external_address,
          chain_id
        `
        )
        .eq('normalized_external_address', normalizedAddress)
        .eq('chain_id', chainId)
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        return null
      }

      // Map to ContactView format (external contacts don't have profile data)
      return {
        contact_id: data.id,
        owner_id: data.owner_id,
        custom_name: data.custom_name,
        notes: data.notes,
        is_favorite: data.is_favorite,
        source: data.source,
        last_interacted_at: data.last_interacted_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        archived_at: data.archived_at,
        external_address: data.external_address,
        chain_id: data.chain_id,
        // External contacts don't have profile data
        profile_name: null,
        avatar_url: null,
        send_id: null,
        main_tag_id: null,
        main_tag_name: null,
        tags: null,
        is_verified: null,
        label_ids: null,
      } as ContactView
    },
    enabled: !!externalAddress,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}
