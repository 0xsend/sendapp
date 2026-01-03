/**
 * Contact mutation hooks for CRUD operations.
 *
 * Tables: contacts
 * RPCs: add_contact_by_lookup, add_external_contact, toggle_contact_favorite
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useAnalytics } from 'app/provider/analytics'
import { CONTACTS_QUERY_KEY } from '../constants'
import type {
  AddContactByLookupParams,
  AddExternalContactParams,
  LookupType,
  UpdateContactParams,
} from '../types'

/**
 * Invalidate all contact queries after a mutation.
 */
function invalidateContactQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] })
}

/**
 * Hook for adding a contact by looking up a sendtag or send_id.
 *
 * Calls the `add_contact_by_lookup` RPC which:
 * 1. Looks up the profile by tag or send_id
 * 2. Creates a contact entry linking the current user to that profile
 *
 * @example
 * ```tsx
 * const { mutate: addContact } = useAddContactByLookup()
 *
 * addContact({
 *   p_identifier: 'alice',
 *   p_lookup_type: 'tag',
 * })
 * ```
 */
export function useAddContactByLookup() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return useMutation({
    async mutationFn(params: {
      identifier: string
      lookupType: LookupType
      customName?: string
      notes?: string
      isFavorite?: boolean
      labelIds?: number[]
    }): Promise<number> {
      const rpcParams: AddContactByLookupParams = {
        p_identifier: params.identifier,
        p_lookup_type: params.lookupType,
        p_custom_name: params.customName,
        p_notes: params.notes,
        p_is_favorite: params.isFavorite,
        p_label_ids: params.labelIds,
      }

      const { data, error } = await supabase.rpc('add_contact_by_lookup', rpcParams)

      if (error) {
        throw new Error(error.message)
      }

      if (data === null) {
        throw new Error('No contact returned from lookup')
      }

      // RPC returns the contact_id
      return data
    },
    async onSuccess() {
      analytics.capture({
        name: 'contact_added',
        properties: { contact_type: 'sendtag' },
      })
      await invalidateContactQueries(queryClient)
    },
  })
}

/**
 * Hook for adding an external contact (wallet address).
 *
 * Creates a contact entry with an external address and chain ID.
 *
 * @example
 * ```tsx
 * const { mutate: addExternalContact } = useAddExternalContact()
 *
 * addExternalContact({
 *   externalAddress: '0x1234...',
 *   chainId: 'eip155:8453',
 *   customName: 'My CEX wallet',
 * })
 * ```
 */
export function useAddExternalContact() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return useMutation({
    async mutationFn(params: {
      externalAddress: string
      chainId: string
      customName?: string
      notes?: string
      isFavorite?: boolean
    }): Promise<number> {
      const rpcParams: AddExternalContactParams = {
        p_external_address: params.externalAddress,
        p_chain_id: params.chainId,
        p_custom_name: params.customName,
        p_notes: params.notes,
        p_is_favorite: params.isFavorite,
      }

      const { data, error } = await supabase.rpc('add_external_contact', rpcParams)

      if (error) {
        throw new Error(error.message)
      }

      if (data === null) {
        throw new Error('No contact returned from external contact creation')
      }

      // RPC returns the contact_id
      return data
    },
    async onSuccess() {
      analytics.capture({
        name: 'contact_added',
        properties: { contact_type: 'address' },
      })
      await invalidateContactQueries(queryClient)
    },
  })
}

/**
 * Hook for toggling a contact's favorite status.
 *
 * @example
 * ```tsx
 * const { mutate: toggleFavorite } = useToggleContactFavorite()
 *
 * toggleFavorite({ contactId: 123 })
 * ```
 */
export function useToggleContactFavorite() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return useMutation({
    async mutationFn({ contactId }: { contactId: number }): Promise<boolean> {
      const { data, error } = await supabase.rpc('toggle_contact_favorite', {
        p_contact_id: contactId,
      })

      if (error) {
        throw new Error(error.message)
      }

      // RPC returns the new is_favorite value
      return data
    },
    async onSuccess(isFavorited) {
      analytics.capture({
        name: 'contact_favorited',
        properties: { is_favorited: isFavorited },
      })
      await invalidateContactQueries(queryClient)
    },
  })
}

/**
 * Hook for updating a contact's custom name and notes.
 *
 * @example
 * ```tsx
 * const { mutate: updateContact } = useUpdateContact()
 *
 * updateContact({
 *   contactId: 123,
 *   customName: 'Alice B.',
 *   notes: 'College friend',
 * })
 * ```
 */
export function useUpdateContact() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(params: UpdateContactParams): Promise<void> {
      const updateData: Record<string, string | null> = {}

      if (params.custom_name !== undefined) {
        updateData.custom_name = params.custom_name
      }
      if (params.notes !== undefined) {
        updateData.notes = params.notes
      }

      // Skip if no updates
      if (Object.keys(updateData).length === 0) {
        return
      }

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', params.contact_id)

      if (error) {
        throw new Error(error.message)
      }
    },
    async onSuccess() {
      await invalidateContactQueries(queryClient)
    },
  })
}

/**
 * Hook for archiving a contact.
 *
 * Sets the archived_at timestamp to the current time.
 * Archived contacts are excluded from normal queries.
 *
 * @example
 * ```tsx
 * const { mutate: archiveContact } = useArchiveContact()
 *
 * archiveContact({ contactId: 123 })
 * ```
 */
export function useArchiveContact() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return useMutation({
    async mutationFn({
      contactId,
      contactType,
    }: {
      contactId: number
      contactType: 'sendtag' | 'address'
    }): Promise<'sendtag' | 'address'> {
      const { error } = await supabase
        .from('contacts')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', contactId)

      if (error) {
        throw new Error(error.message)
      }

      return contactType
    },
    async onSuccess(contactType) {
      analytics.capture({
        name: 'contact_archived',
        properties: { contact_type: contactType },
      })
      await invalidateContactQueries(queryClient)
    },
  })
}

/**
 * Hook for unarchiving a contact.
 *
 * Clears the archived_at timestamp.
 *
 * @example
 * ```tsx
 * const { mutate: unarchiveContact } = useUnarchiveContact()
 *
 * unarchiveContact({ contactId: 123 })
 * ```
 */
export function useUnarchiveContact() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return useMutation({
    async mutationFn({
      contactId,
      contactType,
    }: {
      contactId: number
      contactType: 'sendtag' | 'address'
    }): Promise<'sendtag' | 'address'> {
      const { error } = await supabase
        .from('contacts')
        .update({ archived_at: null })
        .eq('id', contactId)

      if (error) {
        throw new Error(error.message)
      }

      return contactType
    },
    async onSuccess(contactType) {
      analytics.capture({
        name: 'contact_unarchived',
        properties: { contact_type: contactType },
      })
      await invalidateContactQueries(queryClient)
    },
  })
}
