/**
 * Utility functions for getting display names from contact data.
 *
 * These functions provide consistent display name logic across the app,
 * following the priority: custom_name > profile_name > sendtag > address.
 */

import { shorten } from 'app/utils/strings'

/**
 * Contact data needed to determine display name.
 */
interface ContactDisplayData {
  custom_name?: string | null
  profile_name?: string | null
  main_tag_name?: string | null
  external_address?: string | null
  send_id?: number | null
}

/**
 * Get the display name for a contact.
 *
 * Priority:
 * 1. custom_name (user-assigned nickname)
 * 2. profile_name (from Send profile)
 * 3. main_tag_name (with leading slash)
 * 4. send_id (formatted as #123)
 * 5. external_address (shortened) - for external contacts
 *
 * @param contact - Contact data object
 * @returns Display name string
 *
 * @example
 * ```ts
 * const name = getContactDisplayName({
 *   custom_name: 'Bobby',
 *   profile_name: 'Robert Smith',
 *   main_tag_name: 'bobby',
 *   send_id: 123,
 * })
 * // Returns 'Bobby'
 * ```
 */
export function getContactDisplayName(contact: ContactDisplayData): string {
  if (contact.custom_name) return contact.custom_name
  if (contact.profile_name) return contact.profile_name
  if (contact.main_tag_name) return `/${contact.main_tag_name}`
  if (contact.send_id) return `#${contact.send_id}`
  if (contact.external_address) return shorten(contact.external_address, 6, 4)
  return '---'
}

/**
 * Result from getProfileDisplayName for rendering names with secondary text.
 */
interface ProfileDisplayNameResult {
  /** Primary name to display prominently */
  primary: string
  /** Secondary name shown in muted/subtle style (optional) */
  secondary?: string
}

/**
 * Get display name components for a profile page.
 *
 * Priority: custom_name > profile_name > main_tag_name > send_id
 *
 * When a contact has a custom_name (nickname), returns:
 * - primary: the custom_name
 * - secondary: profile_name or sendtag (for showing "Nickname (Profile Name)" format)
 *
 * When no custom_name, returns:
 * - primary: profile_name, sendtag, or send_id
 * - secondary: undefined
 *
 * @param contact - Contact data object
 * @returns Object with primary and optional secondary display names
 *
 * @example
 * ```ts
 * const { primary, secondary } = getProfileDisplayName({
 *   custom_name: 'Bobby',
 *   profile_name: 'Robert Smith',
 *   main_tag_name: 'bobby',
 *   send_id: 123,
 * })
 * // Returns { primary: 'Bobby', secondary: 'Robert Smith' }
 *
 * // Render as: Bobby (Robert Smith)
 * ```
 */
export function getProfileDisplayName(
  contact: Pick<ContactDisplayData, 'custom_name' | 'profile_name' | 'main_tag_name' | 'send_id'>
): ProfileDisplayNameResult {
  // Priority: custom_name > profile_name > main_tag_name > send_id
  if (contact.custom_name) {
    // Show nickname as primary, profile_name or sendtag as secondary
    const secondary =
      contact.profile_name || (contact.main_tag_name ? `/${contact.main_tag_name}` : undefined)
    return { primary: contact.custom_name, secondary }
  }

  if (contact.profile_name) return { primary: contact.profile_name }
  if (contact.main_tag_name) return { primary: `/${contact.main_tag_name}` }
  if (contact.send_id) return { primary: `#${contact.send_id}` }

  return { primary: '---' }
}
