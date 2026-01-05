import { Dialog, Sheet, useAppToast, VisuallyHidden, YStack } from '@my/ui'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'
import { useContactLabels } from '../hooks/useContactLabels'
import { useToggleContactFavorite, useUpdateContact } from '../hooks/useContactMutation'
import { useContactArchive } from '../hooks/useContactArchive'
import { useContactEditState } from '../hooks/useContactEditState'
import type { ContactView } from '../types'
import { getContactDisplayName } from '../utils/getContactDisplayName'
import { ContactDetailProvider, type ContactDetailContextValue } from './ContactDetailContext'
import { ContactDetailHeader } from './ContactDetailHeader'
import { ContactDetailAvatar } from './ContactDetailAvatar'
import { ContactDetailLabels } from './ContactDetailLabels'
import { ContactDetailNotes } from './ContactDetailNotes'
import { ContactDetailActions } from './ContactDetailActions'
import { ContactArchiveSection } from './ContactArchiveSection'

/**
 * Props for the ContactDetailSheet component.
 */
interface ContactDetailSheetProps {
  /** The contact to display */
  contact: ContactView
  /** Whether the sheet is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when the contact is updated (for refreshing data) */
  onUpdate?: () => void
  /** Hide View Profile and Send buttons (useful when opened from profile page) */
  hideNavButtons?: boolean
}

/**
 * Bottom sheet for viewing and editing a contact.
 *
 * Uses React Context to share state with child components, eliminating prop drilling.
 * Child components access shared state via useContactDetail() hook.
 *
 * Features:
 * - Display contact info: avatar, name, tags, address, notes
 * - Edit mode toggle for custom_name and notes
 * - Favorite toggle button
 * - Label management section
 * - Archive/Restore button with confirmation
 * - Send money button (links to send flow)
 *
 * Uses Dialog on web and Sheet on native for platform-appropriate UX.
 */
export const ContactDetailSheet = memo(function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
  onUpdate,
  hideNavButtons = false,
}: ContactDetailSheetProps) {
  const toast = useAppToast()
  const router = useRouter()

  // Edit state hook
  const { editState, isEditing, startEditing, stopEditing, updateEditField } =
    useContactEditState(contact)

  // Archive hook
  const {
    showArchiveConfirm,
    showConfirm,
    hideConfirm,
    handleArchiveToggle,
    isArchiving,
    isUnarchiving,
    isArchived,
  } = useContactArchive(contact, onOpenChange, onUpdate)

  // Fetch all labels to display assigned ones
  const { data: allLabels } = useContactLabels()

  // Mutations
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleContactFavorite()
  const { mutate: updateContact, isPending: isUpdating } = useUpdateContact()

  // Local favorite state for optimistic updates
  const [localIsFavorite, setLocalIsFavorite] = useState(contact.is_favorite ?? false)

  // Sync local state when contact prop changes
  useEffect(() => {
    setLocalIsFavorite(contact.is_favorite ?? false)
  }, [contact.is_favorite])

  // Derived state
  const isMutating = isTogglingFavorite || isUpdating || isArchiving || isUnarchiving

  // Display name using the shared utility
  const displayName = useMemo(() => getContactDisplayName(contact), [contact])

  // Only show View Profile for Send users (those with a send_id)
  const canViewProfile = Boolean(contact.send_id)

  // Check if external contact is on an EVM chain
  const isEvmExternalContact = useMemo(() => {
    if (!contact.external_address || !contact.chain_id) return false
    return String(contact.chain_id).startsWith('eip155:')
  }, [contact.external_address, contact.chain_id])

  // Determine if Send Money should be available
  const canSendMoney = Boolean(contact.main_tag_name || contact.send_id || isEvmExternalContact)

  // Close handler
  const close = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(() => {
    if (contact.contact_id === null) return

    const newFavoriteState = !localIsFavorite
    setLocalIsFavorite(newFavoriteState)

    toggleFavorite(
      { contactId: contact.contact_id },
      {
        onSuccess: () => {
          toast.show(newFavoriteState ? 'Added to favorites' : 'Removed from favorites')
          onUpdate?.()
        },
        onError: (error) => {
          setLocalIsFavorite(!newFavoriteState)
          toast.error(error.message)
        },
      }
    )
  }, [contact.contact_id, localIsFavorite, toggleFavorite, toast, onUpdate])

  // Handle save edits
  const handleSaveEdits = useCallback(() => {
    if (contact.contact_id === null || editState === null) return

    const updates: { custom_name?: string | null; notes?: string | null } = {}

    const trimmedName = editState.customName.trim()
    const trimmedNotes = editState.notes.trim()

    if (trimmedName !== (contact.custom_name ?? '')) {
      updates.custom_name = trimmedName === '' ? null : trimmedName
    }
    if (trimmedNotes !== (contact.notes ?? '')) {
      updates.notes = trimmedNotes === '' ? null : trimmedNotes
    }

    if (Object.keys(updates).length === 0) {
      stopEditing()
      return
    }

    updateContact(
      { contact_id: contact.contact_id, ...updates },
      {
        onSuccess: () => {
          toast.show('Contact updated')
          stopEditing()
          onUpdate?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }, [
    contact.contact_id,
    contact.custom_name,
    contact.notes,
    editState,
    stopEditing,
    updateContact,
    toast,
    onUpdate,
  ])

  // Handle cancel edits
  const handleCancelEdits = useCallback(() => {
    stopEditing()
  }, [stopEditing])

  // Handle send money
  const handleSendMoney = useCallback(() => {
    onOpenChange(false)

    if (contact.main_tag_name) {
      router.push(`/send?idType=tag&recipient=${encodeURIComponent(contact.main_tag_name)}`)
    } else if (contact.send_id) {
      router.push(`/send?idType=sendid&recipient=${encodeURIComponent(String(contact.send_id))}`)
    } else if (isEvmExternalContact && contact.external_address) {
      router.push(`/send?idType=address&recipient=${encodeURIComponent(contact.external_address)}`)
    }
  }, [
    contact.main_tag_name,
    contact.send_id,
    contact.external_address,
    isEvmExternalContact,
    router,
    onOpenChange,
  ])

  // Handle view profile
  const handleViewProfile = useCallback(() => {
    if (!contact.send_id) return
    onOpenChange(false)
    router.push(`/profile/${contact.send_id}`)
  }, [contact.send_id, onOpenChange, router])

  // Build profile object for AvatarProfile
  const profileForAvatar = useMemo(
    () => ({
      name: contact.profile_name ?? null,
      avatar_url: contact.avatar_url ?? null,
      is_verified: contact.is_verified ?? false,
    }),
    [contact.profile_name, contact.avatar_url, contact.is_verified]
  )

  // Parse label IDs from the contact
  const assignedLabelIds = useMemo(() => {
    return contact.label_ids ?? []
  }, [contact.label_ids])

  // Get the labels that are assigned to this contact
  const assignedLabels = useMemo(() => {
    if (!allLabels || !contact.label_ids) return []
    const labelSet = new Set(contact.label_ids)
    return allLabels.filter((label) => labelSet.has(label.id))
  }, [allLabels, contact.label_ids])

  // Build context value
  const contextValue: ContactDetailContextValue = useMemo(
    () => ({
      contact,
      displayName,
      open,
      close,
      onUpdate,
      hideNavButtons,
      editState,
      isEditing,
      startEditing,
      stopEditing,
      updateEditField,
      localIsFavorite,
      handleToggleFavorite,
      isMutating,
      isTogglingFavorite,
      isUpdating,
      isArchived,
      isArchiving,
      isUnarchiving,
      showArchiveConfirm,
      showConfirm,
      hideConfirm,
      handleArchiveToggle,
      canViewProfile,
      canSendMoney,
      handleViewProfile,
      handleSendMoney,
      handleSaveEdits,
      handleCancelEdits,
      assignedLabelIds,
      assignedLabels,
      profileForAvatar,
    }),
    [
      contact,
      displayName,
      open,
      close,
      onUpdate,
      hideNavButtons,
      editState,
      isEditing,
      startEditing,
      stopEditing,
      updateEditField,
      localIsFavorite,
      handleToggleFavorite,
      isMutating,
      isTogglingFavorite,
      isUpdating,
      isArchived,
      isArchiving,
      isUnarchiving,
      showArchiveConfirm,
      showConfirm,
      hideConfirm,
      handleArchiveToggle,
      canViewProfile,
      canSendMoney,
      handleViewProfile,
      handleSendMoney,
      handleSaveEdits,
      handleCancelEdits,
      assignedLabelIds,
      assignedLabels,
      profileForAvatar,
    ]
  )

  // Sheet content using composed components
  const sheetContent = (
    <ContactDetailProvider value={contextValue}>
      <YStack gap="$4" padding="$4" pb="$6">
        <ContactDetailHeader />
        <ContactDetailAvatar />
        <ContactDetailLabels />
        <ContactDetailNotes />
        <ContactDetailActions />
        <ContactArchiveSection />
      </YStack>
    </ContactDetailProvider>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
    return (
      <Dialog modal open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            width="90%"
            maxWidth={500}
            overflow="hidden"
          >
            <VisuallyHidden>
              <Dialog.Title>Contact Details</Dialog.Title>
            </VisuallyHidden>
            {sheetContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  // Native version using Sheet
  return (
    <Sheet
      open={open}
      modal
      onOpenChange={onOpenChange}
      dismissOnSnapToBottom
      dismissOnOverlayPress={!isMutating}
      native
      snapPoints={[85]}
    >
      <Sheet.Frame key="contact-detail-sheet">
        <Sheet.ScrollView>{sheetContent}</Sheet.ScrollView>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
})
