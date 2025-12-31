import type { Database, Tables } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Source indicating how a contact was added to the contact book.
 * - activity: Added from transaction history
 * - manual: Added manually by user lookup
 * - external: Imported from external sources (future)
 * - referral: Added from referral relationship
 */
export type ContactSource = Database['public']['Enums']['contact_source_enum']

/**
 * Lookup type for adding contacts by identifier.
 */
export type LookupType = Database['public']['Enums']['lookup_type_enum']

/**
 * Filter options for querying contacts.
 * Uses discriminated union to ensure type safety.
 */
export type ContactFilter =
  | { type: 'all' }
  | { type: 'favorites' }
  | { type: 'archived' }
  | { type: 'label'; labelId: number }
  | { type: 'source'; source: ContactSource }

/**
 * Contact search result from the contact_search RPC.
 * Maps directly to the contact_search_result composite type.
 */
export type ContactView = Database['public']['CompositeTypes']['contact_search_result']

/**
 * Contact label type from the contact_labels table.
 */
export type ContactLabel = Tables<'contact_labels'>

/**
 * Contact label assignment junction type.
 */
export type ContactLabelAssignment = Tables<'contact_label_assignments'>

/**
 * Parameters for the contact_search RPC.
 * Matches the function signature in the database.
 */
export type ContactSearchParams = Database['public']['Functions']['contact_search']['Args']

/**
 * Parameters for adding a contact by lookup.
 * Matches the add_contact_by_lookup RPC signature.
 */
export type AddContactByLookupParams =
  Database['public']['Functions']['add_contact_by_lookup']['Args']

/**
 * Parameters for adding an external contact.
 * Matches the add_external_contact RPC signature.
 */
export type AddExternalContactParams =
  Database['public']['Functions']['add_external_contact']['Args']

/**
 * Parameters for updating a contact.
 */
export interface UpdateContactParams {
  /** Contact ID to update */
  contact_id: number
  /** New custom display name (null to clear) */
  custom_name?: string | null
  /** New notes (null to clear) */
  notes?: string | null
}

/**
 * Contact book context state.
 */
export interface ContactBookState {
  /** Current search query */
  query: string
  /** Current filter */
  filter: ContactFilter
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: PostgrestError | null
}

/**
 * Contact book context actions.
 */
export interface ContactBookActions {
  /** Set the search query */
  setQuery: (query: string) => void
  /** Set the filter */
  setFilter: (filter: ContactFilter) => void
  /** Clear the search query and reset filter */
  clearSearch: () => void
}

/**
 * Combined contact book context value.
 */
export interface ContactBookContextValue extends ContactBookState, ContactBookActions {}
