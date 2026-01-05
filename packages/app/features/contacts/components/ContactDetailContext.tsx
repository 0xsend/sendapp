import { createContext, useContext, type ReactNode } from 'react'
import type { ContactView, ContactLabel } from '../types'

/**
 * Edit state for contact form fields.
 */
export interface ContactEditState {
  customName: string
  notes: string
}

/**
 * Context value for ContactDetail components.
 */
export interface ContactDetailContextValue {
  /** The contact being displayed/edited */
  contact: ContactView

  /** Display name computed from contact */
  displayName: string

  /** Whether the sheet/dialog is open */
  open: boolean

  /** Close the sheet/dialog */
  close: () => void

  /** Callback when contact data is updated */
  onUpdate?: () => void

  /** Hide navigation buttons (View Profile, Send) */
  hideNavButtons: boolean

  /** Edit state (null when not editing) */
  editState: ContactEditState | null

  /** Whether currently in edit mode */
  isEditing: boolean

  /** Start editing mode */
  startEditing: () => void

  /** Stop editing mode */
  stopEditing: () => void

  /** Update a field in edit state */
  updateEditField: (field: keyof ContactEditState, value: string) => void

  /** Local favorite state for optimistic updates */
  localIsFavorite: boolean

  /** Toggle favorite state */
  handleToggleFavorite: () => void

  /** Whether any mutation is in progress */
  isMutating: boolean

  /** Individual mutation states */
  isTogglingFavorite: boolean
  isUpdating: boolean

  /** Archive-related state and handlers */
  isArchived: boolean
  isArchiving: boolean
  isUnarchiving: boolean
  showArchiveConfirm: boolean
  showConfirm: () => void
  hideConfirm: () => void
  handleArchiveToggle: () => void

  /** Navigation handlers */
  canViewProfile: boolean
  canSendMoney: boolean
  handleViewProfile: () => void
  handleSendMoney: () => void

  /** Save/cancel handlers */
  handleSaveEdits: () => void
  handleCancelEdits: () => void

  /** Labels */
  assignedLabelIds: number[]
  assignedLabels: ContactLabel[]

  /** Profile object for avatar */
  profileForAvatar: {
    name: string | null
    avatar_url: string | null
    is_verified: boolean
  }
}

const ContactDetailContext = createContext<ContactDetailContextValue | null>(null)

/**
 * Hook to access ContactDetail context.
 * Throws if used outside of ContactDetailProvider.
 */
export function useContactDetail(): ContactDetailContextValue {
  const context = useContext(ContactDetailContext)
  if (context === null) {
    throw new Error('useContactDetail must be used within a ContactDetailProvider')
  }
  return context
}

/**
 * Props for ContactDetailProvider.
 */
interface ContactDetailProviderProps {
  value: ContactDetailContextValue
  children: ReactNode
}

/**
 * Provider for ContactDetail context.
 */
export function ContactDetailProvider({ value, children }: ContactDetailProviderProps) {
  return <ContactDetailContext.Provider value={value}>{children}</ContactDetailContext.Provider>
}
