import { useCallback, useState } from 'react'
import type { ContactView } from '../types'

/**
 * Edit state for contact form fields.
 */
export interface ContactEditState {
  customName: string
  notes: string
}

/**
 * Return type for useContactEditState hook.
 */
export interface UseContactEditStateReturn {
  /** Current edit state (null when not editing) */
  editState: ContactEditState | null
  /** Whether currently in edit mode */
  isEditing: boolean
  /** Start editing mode with current contact values */
  startEditing: () => void
  /** Exit edit mode */
  stopEditing: () => void
  /** Update a field in edit state */
  updateEditField: (field: keyof ContactEditState, value: string) => void
}

/**
 * Hook for managing contact edit state.
 *
 * Initializes form values when entering edit mode to avoid stale data.
 * The edit state is null when not editing.
 */
export function useContactEditState(contact: ContactView): UseContactEditStateReturn {
  const [editState, setEditState] = useState<ContactEditState | null>(null)

  const isEditing = editState !== null

  const startEditing = useCallback(() => {
    setEditState({
      customName: contact.custom_name ?? '',
      notes: contact.notes ?? '',
    })
  }, [contact.custom_name, contact.notes])

  const stopEditing = useCallback(() => {
    setEditState(null)
  }, [])

  const updateEditField = useCallback((field: keyof ContactEditState, value: string) => {
    setEditState((prev) => (prev ? { ...prev, [field]: value } : null))
  }, [])

  return {
    editState,
    isEditing,
    startEditing,
    stopEditing,
    updateEditField,
  }
}
