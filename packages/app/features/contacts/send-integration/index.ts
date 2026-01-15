/**
 * Contacts integration with the Send flow.
 *
 * Provides components and hooks for using contacts in the Send page.
 */

export { SendContactsSection, ContactsRow, ContactSuggestion } from './SendContactsSection'
export {
  useFavoriteContacts,
  useRecentContacts,
  useSendPageContacts,
  type SendContactItem,
} from './useFavoriteContacts'
