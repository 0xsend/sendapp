// Screen
export { ContactsScreen } from './screen'

// Provider
export { ContactBookProvider, useContactBook } from './ContactBookProvider'

// Components
export {
  ContactList,
  ContactListItem,
  ContactSearchBar,
  ContactFilters,
  ContactDetailSheet,
  AddContactForm,
  LabelChip,
  LabelSelector,
  type ContactListProps,
  type ContactListItemProps,
  type ContactSearchBarProps,
  type ContactFiltersProps,
} from './components'

// Types
export type {
  ContactBookActions,
  ContactBookContextValue,
  ContactBookState,
  ContactFilter,
  ContactLabel,
  ContactLabelAssignment,
  ContactSearchParams,
  ContactSource,
  ContactView,
  LookupType,
  AddContactByLookupParams,
  AddExternalContactParams,
  UpdateContactParams,
} from './types'

// Constants
export {
  CONTACTS_CUSTOM_NAME_MAX,
  CONTACTS_LABEL_NAME_MAX,
  CONTACTS_NOTES_MAX,
  CONTACTS_PAGE_SIZE,
  CONTACTS_QUERY_KEY,
  CONTACTS_SEARCH_DEBOUNCE_MS,
} from './constants'

// Hooks
export { useContacts, type UseContactsResult } from './hooks/useContacts'
export { useContactSearch, contactSearchQueryKey } from './hooks/useContactSearch'
export {
  useAddContactByLookup,
  useAddExternalContact,
  useArchiveContact,
  useToggleContactFavorite,
  useUnarchiveContact,
  useUpdateContact,
} from './hooks/useContactMutation'
export {
  useAssignContactLabel,
  useContactLabels,
  useCreateContactLabel,
  useDeleteContactLabel,
  useUnassignContactLabel,
  useUpdateContactLabel,
} from './hooks/useContactLabels'
