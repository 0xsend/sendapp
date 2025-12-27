import { Button, Input, Paragraph, Spinner, XStack, YStack, type YStackProps } from '@my/ui'
import { IconPlus } from 'app/components/icons'
import { memo, useCallback, useMemo, useState } from 'react'
import { CONTACTS_LABEL_NAME_MAX } from '../constants'
import {
  useAssignContactLabel,
  useContactLabels,
  useCreateContactLabel,
  useUnassignContactLabel,
} from '../hooks/useContactLabels'
import type { ContactLabel } from '../types'
import { LabelChip } from './LabelChip'

/**
 * Props for the LabelSelector component.
 */
interface LabelSelectorProps extends YStackProps {
  /** Contact ID to manage labels for */
  contactId: number
  /** Currently assigned label IDs */
  assignedLabelIds: number[]
  /** Callback when labels change */
  onLabelsChange?: () => void
}

/**
 * A label selector for assigning labels to contacts.
 *
 * Features:
 * - Lists all available labels with selection state
 * - Allows creating new labels inline
 * - Visual feedback during mutations (opacity change)
 *
 * @example
 * ```tsx
 * <LabelSelector
 *   contactId={contact.id}
 *   assignedLabelIds={contact.label_ids ?? []}
 *   onLabelsChange={refetch}
 * />
 * ```
 */
export const LabelSelector = memo(function LabelSelector({
  contactId,
  assignedLabelIds,
  onLabelsChange,
  ...rest
}: LabelSelectorProps) {
  // Fetch all labels
  const { data: labels, isLoading: isLoadingLabels } = useContactLabels()

  // Mutations
  const { mutate: assignLabel, isPending: isAssigning } = useAssignContactLabel()
  const { mutate: unassignLabel, isPending: isUnassigning } = useUnassignContactLabel()
  const { mutate: createLabel, isPending: isCreating } = useCreateContactLabel()

  // Local state for new label input
  const [newLabelName, setNewLabelName] = useState('')
  const [showNewLabelInput, setShowNewLabelInput] = useState(false)

  // Convert assigned label IDs to a Set for fast lookup
  const assignedSet = useMemo(() => new Set(assignedLabelIds), [assignedLabelIds])

  // Handle toggling a label assignment
  const handleLabelPress = useCallback(
    (label: ContactLabel) => {
      const isAssigned = assignedSet.has(label.id)

      if (isAssigned) {
        unassignLabel({ contactId, labelId: label.id }, { onSuccess: onLabelsChange })
      } else {
        assignLabel({ contactId, labelId: label.id }, { onSuccess: onLabelsChange })
      }
    },
    [contactId, assignedSet, assignLabel, unassignLabel, onLabelsChange]
  )

  // Handle creating a new label
  const handleCreateLabel = useCallback(() => {
    const trimmedName = newLabelName.trim()
    if (trimmedName.length === 0 || trimmedName.length > CONTACTS_LABEL_NAME_MAX) {
      return
    }

    createLabel(
      { name: trimmedName },
      {
        onSuccess: (newLabel) => {
          setNewLabelName('')
          setShowNewLabelInput(false)
          // Optionally assign the new label immediately
          assignLabel({ contactId, labelId: newLabel.id }, { onSuccess: onLabelsChange })
        },
      }
    )
  }, [newLabelName, createLabel, assignLabel, contactId, onLabelsChange])

  // Handle canceling new label creation
  const handleCancelCreate = useCallback(() => {
    setNewLabelName('')
    setShowNewLabelInput(false)
  }, [])

  const isMutating = isAssigning || isUnassigning || isCreating

  if (isLoadingLabels) {
    return (
      <YStack padding="$3" alignItems="center" {...rest}>
        <Spinner size="small" />
      </YStack>
    )
  }

  return (
    <YStack gap="$3" {...rest}>
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph fontWeight="600" color="$color11">
          Labels
        </Paragraph>
        {!showNewLabelInput && (
          <Button
            size="$2"
            chromeless
            onPress={() => setShowNewLabelInput(true)}
            disabled={isMutating}
            icon={<IconPlus size={16} color="$color11" />}
          >
            <Button.Text fontSize="$2" color="$color11">
              New
            </Button.Text>
          </Button>
        )}
      </XStack>

      {/* New label input */}
      {showNewLabelInput && (
        <XStack gap="$2" alignItems="center">
          <Input
            flex={1}
            size="$3"
            placeholder="Label name"
            value={newLabelName}
            onChangeText={setNewLabelName}
            maxLength={CONTACTS_LABEL_NAME_MAX}
            autoFocus
            onSubmitEditing={handleCreateLabel}
          />
          <Button
            size="$3"
            onPress={handleCreateLabel}
            disabled={
              newLabelName.trim().length === 0 ||
              newLabelName.length > CONTACTS_LABEL_NAME_MAX ||
              isCreating
            }
          >
            {isCreating ? <Spinner size="small" /> : <Button.Text>Add</Button.Text>}
          </Button>
          <Button size="$3" chromeless onPress={handleCancelCreate}>
            <Button.Text color="$color10">Cancel</Button.Text>
          </Button>
        </XStack>
      )}

      {/* Labels list */}
      {labels && labels.length > 0 ? (
        <XStack flexWrap="wrap" gap="$2">
          {labels.map((label) => (
            <LabelChip
              key={label.id}
              label={label}
              selected={assignedSet.has(label.id)}
              onPress={handleLabelPress}
              opacity={isMutating ? 0.6 : 1}
            />
          ))}
        </XStack>
      ) : (
        <Paragraph color="$color10" fontSize="$3">
          No labels yet. Create one to organize your contacts.
        </Paragraph>
      )}
    </YStack>
  )
})
