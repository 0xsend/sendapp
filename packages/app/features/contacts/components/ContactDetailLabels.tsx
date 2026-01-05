import { XStack } from '@my/ui'
import { memo } from 'react'
import { useContactDetail } from './ContactDetailContext'
import { LabelChip } from './LabelChip'
import { LabelSelector } from './LabelSelector'

/**
 * Labels display section (view mode) and label selector (edit mode).
 */
export const ContactDetailLabels = memo(function ContactDetailLabels() {
  const { contact, isEditing, assignedLabels, assignedLabelIds, onUpdate } = useContactDetail()

  // In edit mode, show the full label selector
  if (isEditing && contact.contact_id !== null) {
    return (
      <LabelSelector
        contactId={contact.contact_id}
        assignedLabelIds={assignedLabelIds}
        onLabelsChange={onUpdate}
      />
    )
  }

  // In view mode, show assigned labels as chips
  if (assignedLabels.length > 0) {
    return (
      <XStack flexWrap="wrap" gap="$2">
        {assignedLabels.map((label) => (
          <LabelChip key={label.id} label={label} />
        ))}
      </XStack>
    )
  }

  return null
})
