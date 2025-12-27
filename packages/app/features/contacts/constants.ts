/**
 * Contact book configuration constants
 */

/** Number of contacts to fetch per page in infinite scroll */
export const CONTACTS_PAGE_SIZE = 20

/** Debounce delay for search input in milliseconds */
export const CONTACTS_SEARCH_DEBOUNCE_MS = 300

/** Maximum length for contact label names */
export const CONTACTS_LABEL_NAME_MAX = 32

/** Maximum length for contact custom display names */
export const CONTACTS_CUSTOM_NAME_MAX = 80

/** Maximum length for contact notes */
export const CONTACTS_NOTES_MAX = 500

/** Query key prefix for all contacts queries */
export const CONTACTS_QUERY_KEY = 'contacts' as const
