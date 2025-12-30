import {
  Button,
  Dialog,
  H4,
  Input,
  Paragraph,
  Sheet,
  Spinner,
  Text,
  TextArea,
  VisuallyHidden,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { IconAccount, IconStar, IconStarOutline, IconTrash, IconX } from 'app/components/icons'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'
import { CONTACTS_CUSTOM_NAME_MAX, CONTACTS_NOTES_MAX } from '../constants'
import {
  useArchiveContact,
  useToggleContactFavorite,
  useUnarchiveContact,
  useUpdateContact,
} from '../hooks/useContactMutation'
import { useContactLabels } from '../hooks/useContactLabels'
import type { ContactView } from '../types'
import { LabelChip } from './LabelChip'
import { LabelSelector } from './LabelSelector'

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
}

/**
 * Bottom sheet for viewing and editing a contact.
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
 *
 * @example
 * ```tsx
 * <ContactDetailSheet
 *   contact={selectedContact}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onUpdate={refetchContacts}
 * />
 * ```
 */
export const ContactDetailSheet = memo(function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
  onUpdate,
}: ContactDetailSheetProps) {
  const toast = useAppToast()
  const router = useRouter()

  // Edit mode state - initialized when entering edit mode to avoid stale data
  const [editState, setEditState] = useState<{
    customName: string
    notes: string
  } | null>(null)

  const isEditing = editState !== null

  // Archive confirmation state
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  // Enter edit mode: initialize form with current contact values
  const startEditing = useCallback(() => {
    setEditState({
      customName: contact.custom_name ?? '',
      notes: contact.notes ?? '',
    })
  }, [contact.custom_name, contact.notes])

  // Exit edit mode
  const stopEditing = useCallback(() => {
    setEditState(null)
  }, [])

  // Update form field while editing
  const updateEditField = useCallback((field: 'customName' | 'notes', value: string) => {
    setEditState((prev) => (prev ? { ...prev, [field]: value } : null))
  }, [])

  // Fetch all labels to display assigned ones
  const { data: allLabels } = useContactLabels()

  // Mutations
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleContactFavorite()
  const { mutate: updateContact, isPending: isUpdating } = useUpdateContact()
  const { mutate: archiveContact, isPending: isArchiving } = useArchiveContact()
  const { mutate: unarchiveContact, isPending: isUnarchiving } = useUnarchiveContact()

  // Local favorite state for optimistic updates
  const [localIsFavorite, setLocalIsFavorite] = useState(contact.is_favorite ?? false)

  // Sync local state when contact prop changes (e.g., after parent refetch)
  // Only sync on contact.is_favorite changes, not on isTogglingFavorite changes
  // to avoid reverting optimistic updates before the refetch completes
  useEffect(() => {
    setLocalIsFavorite(contact.is_favorite ?? false)
  }, [contact.is_favorite])

  // Derived state
  const isArchived = Boolean(contact.archived_at)
  const isMutating = isTogglingFavorite || isUpdating || isArchiving || isUnarchiving

  // Display name priority: custom_name > profile name > main_tag_name > address
  const displayName = useMemo(() => {
    if (contact.custom_name) return contact.custom_name
    if (contact.profile_name) return contact.profile_name
    if (contact.main_tag_name) return `/${contact.main_tag_name}`
    if (contact.external_address) {
      const addr = contact.external_address
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
    return 'Unknown Contact'
  }, [contact])

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(() => {
    if (contact.contact_id === null) return

    // Optimistically update local state
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
          // Revert on error
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

    // Only update if values changed
    // Use null to clear values (empty string means clear)
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

  // Handle cancel edits - just exit edit mode, next edit will reinitialize
  const handleCancelEdits = useCallback(() => {
    stopEditing()
  }, [stopEditing])

  // Handle archive/unarchive
  const handleArchiveToggle = useCallback(() => {
    if (contact.contact_id === null) return

    if (isArchived) {
      unarchiveContact(
        { contactId: contact.contact_id },
        {
          onSuccess: () => {
            toast.show('Contact restored')
            setShowArchiveConfirm(false)
            onUpdate?.()
          },
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    } else {
      archiveContact(
        { contactId: contact.contact_id },
        {
          onSuccess: () => {
            toast.show('Contact archived')
            setShowArchiveConfirm(false)
            onOpenChange(false)
            onUpdate?.()
          },
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    }
  }, [
    contact.contact_id,
    isArchived,
    archiveContact,
    unarchiveContact,
    toast,
    onOpenChange,
    onUpdate,
  ])

  // Check if external contact is on an EVM chain (send flow only supports EVM)
  const isEvmExternalContact = useMemo(() => {
    if (!contact.external_address || !contact.chain_id) return false
    // CAIP-2 format: eip155:chainId
    return String(contact.chain_id).startsWith('eip155:')
  }, [contact.external_address, contact.chain_id])

  // Determine if Send Money should be available
  const canSendMoney = Boolean(contact.main_tag_name || contact.send_id || isEvmExternalContact)

  // Handle send money
  const handleSendMoney = useCallback(() => {
    onOpenChange(false)

    // Navigate to send flow with recipient info
    // Send flow requires both idType and recipient params
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

  // Build profile object for AvatarProfile
  const profileForAvatar = useMemo(
    () => ({
      name: contact.profile_name,
      avatar_url: contact.avatar_url,
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

  // Sheet content
  const sheetContent = (
    <YStack gap="$4" padding="$4" pb="$6">
      {/* Header with close button */}
      <XStack justifyContent="space-between" alignItems="center">
        <H4>Contact Details</H4>
        <Button
          size="$3"
          circular
          chromeless
          onPress={() => onOpenChange(false)}
          icon={<IconX size={20} color="$color12" />}
        />
      </XStack>

      {/* Avatar and name */}
      <XStack gap="$4" alignItems="center">
        {contact.avatar_url || contact.profile_name ? (
          <AvatarProfile profile={profileForAvatar} size="$7" />
        ) : (
          <XStack
            width="$7"
            height="$7"
            backgroundColor="$color4"
            borderRadius="$4"
            alignItems="center"
            justifyContent="center"
          >
            <IconAccount size="$5" color="$color11" />
          </XStack>
        )}

        <YStack flex={1} gap="$1">
          {isEditing && editState ? (
            <Input
              value={editState.customName}
              onChangeText={(v) => updateEditField('customName', v)}
              placeholder="Display name"
              maxLength={CONTACTS_CUSTOM_NAME_MAX}
              size="$4"
            />
          ) : (
            <Text fontSize="$6" fontWeight="600" numberOfLines={1}>
              {displayName}
            </Text>
          )}

          {/* Sendtags - only show if displayName is not already showing the tag */}
          {contact.tags &&
            contact.tags.length > 0 &&
            !isEditing &&
            !displayName.startsWith('/') && (
              <Text fontSize="$3" color="$color10">
                /{contact.tags.join(', /')}
              </Text>
            )}

          {/* External address */}
          {contact.external_address && (
            <Text fontSize="$2" color="$color10" fontFamily="$mono">
              {contact.external_address}
            </Text>
          )}
        </YStack>

        {/* Favorite button */}
        <Button
          testID="favoriteButton"
          size="$4"
          circular
          chromeless
          onPress={handleToggleFavorite}
          disabled={isMutating}
          aria-pressed={localIsFavorite}
          icon={
            isTogglingFavorite ? (
              <Spinner size="small" />
            ) : localIsFavorite ? (
              <IconStar size={24} color="$yellow10" />
            ) : (
              <IconStarOutline size={24} color="$color10" />
            )
          }
        />
      </XStack>

      {/* Labels display (when not editing) */}
      {!isEditing && assignedLabels.length > 0 && (
        <XStack flexWrap="wrap" gap="$2">
          {assignedLabels.map((label) => (
            <LabelChip key={label.id} label={label} />
          ))}
        </XStack>
      )}

      {/* Notes */}
      <YStack gap="$2">
        <Text fontWeight="600" color="$color11">
          Notes
        </Text>
        {isEditing && editState ? (
          <TextArea
            value={editState.notes}
            onChangeText={(v) => updateEditField('notes', v)}
            placeholder="Add notes about this contact..."
            maxLength={CONTACTS_NOTES_MAX}
            minHeight={80}
          />
        ) : (
          <Paragraph color={contact.notes ? '$color12' : '$color10'}>
            {contact.notes || 'No notes'}
          </Paragraph>
        )}
      </YStack>

      {/* Label selector (in edit mode) */}
      {isEditing && contact.contact_id !== null && (
        <LabelSelector
          contactId={contact.contact_id}
          assignedLabelIds={assignedLabelIds}
          onLabelsChange={onUpdate}
        />
      )}

      {/* Edit/Save buttons */}
      {isEditing ? (
        <XStack gap="$3">
          <Button flex={1} onPress={handleCancelEdits} disabled={isUpdating}>
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button
            flex={1}
            theme="active"
            onPress={handleSaveEdits}
            disabled={isUpdating}
            icon={isUpdating ? <Spinner size="small" /> : undefined}
          >
            <Button.Text>Save</Button.Text>
          </Button>
        </XStack>
      ) : (
        <Button onPress={startEditing}>
          <Button.Text>Edit Contact</Button.Text>
        </Button>
      )}

      {/* Send button - only for Send users or EVM external contacts */}
      {canSendMoney && (
        <Button theme="green" onPress={handleSendMoney}>
          <Button.Text>Send</Button.Text>
        </Button>
      )}

      {/* Archive/Restore section */}
      {!isEditing && (
        <YStack gap="$2" paddingTop="$4" borderTopWidth={1} borderTopColor="$color4">
          {showArchiveConfirm ? (
            <YStack gap="$3">
              <Paragraph color="$color11" textAlign="center">
                {isArchived
                  ? 'Restore this contact to your active list?'
                  : 'Archive this contact? You can restore it later.'}
              </Paragraph>
              <XStack gap="$3">
                <Button flex={1} onPress={() => setShowArchiveConfirm(false)} disabled={isMutating}>
                  <Button.Text>Cancel</Button.Text>
                </Button>
                <Button
                  flex={1}
                  backgroundColor={isArchived ? '$green9' : '$red9'}
                  onPress={handleArchiveToggle}
                  disabled={isMutating}
                  icon={isMutating ? <Spinner size="small" color="$white" /> : undefined}
                  hoverStyle={{ backgroundColor: isArchived ? '$green10' : '$red10' }}
                >
                  <Button.Text color="$white">{isArchived ? 'Restore' : 'Archive'}</Button.Text>
                </Button>
              </XStack>
            </YStack>
          ) : (
            <Button
              testID={isArchived ? 'unarchiveContactButton' : 'archiveContactButton'}
              chromeless
              onPress={() => setShowArchiveConfirm(true)}
              icon={<IconTrash size={18} color={isArchived ? '$green10' : '$red10'} />}
            >
              <Button.Text color={isArchived ? '$green10' : '$red10'}>
                {isArchived ? 'Restore Contact' : 'Archive Contact'}
              </Button.Text>
            </Button>
          )}
        </YStack>
      )}
    </YStack>
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
