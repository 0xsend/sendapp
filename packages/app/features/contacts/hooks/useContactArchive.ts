import { useAppToast } from '@my/ui'
import { useCallback, useState } from 'react'
import { useArchiveContact, useUnarchiveContact } from './useContactMutation'
import type { ContactView } from '../types'

/**
 * Return type for useContactArchive hook.
 */
export interface UseContactArchiveReturn {
  /** Whether the archive confirmation is shown */
  showArchiveConfirm: boolean
  /** Show the archive confirmation */
  showConfirm: () => void
  /** Hide the archive confirmation */
  hideConfirm: () => void
  /** Execute the archive/unarchive action */
  handleArchiveToggle: () => void
  /** Whether archive mutation is pending */
  isArchiving: boolean
  /** Whether unarchive mutation is pending */
  isUnarchiving: boolean
  /** Whether the contact is archived */
  isArchived: boolean
}

/**
 * Hook for managing contact archive/unarchive functionality.
 *
 * Handles confirmation state and mutations for archiving and restoring contacts.
 */
export function useContactArchive(
  contact: ContactView,
  onOpenChange: (open: boolean) => void,
  onUpdate?: () => void
): UseContactArchiveReturn {
  const toast = useAppToast()
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const { mutate: archiveContact, isPending: isArchiving } = useArchiveContact()
  const { mutate: unarchiveContact, isPending: isUnarchiving } = useUnarchiveContact()

  const isArchived = Boolean(contact.archived_at)

  const showConfirm = useCallback(() => {
    setShowArchiveConfirm(true)
  }, [])

  const hideConfirm = useCallback(() => {
    setShowArchiveConfirm(false)
  }, [])

  const handleArchiveToggle = useCallback(() => {
    if (contact.contact_id === null) return

    const contactType = contact.send_id ? 'sendtag' : 'address'

    if (isArchived) {
      unarchiveContact(
        { contactId: contact.contact_id, contactType },
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
        { contactId: contact.contact_id, contactType },
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
    contact.send_id,
    isArchived,
    archiveContact,
    unarchiveContact,
    toast,
    onOpenChange,
    onUpdate,
  ])

  return {
    showArchiveConfirm,
    showConfirm,
    hideConfirm,
    handleArchiveToggle,
    isArchiving,
    isUnarchiving,
    isArchived,
  }
}
