import { Button, Input, Paragraph, Spinner, XStack, YStack, type YStackProps } from '@my/ui'
import { IconPlus } from 'app/components/icons'
import { memo, useCallback, useMemo, useState } from 'react'
import { CONTACTS_LABEL_NAME_MAX } from '../constants'
import { useContactLabels, useCreateContactLabel } from '../hooks/useContactLabels'
import type { ContactLabel } from '../types'
import { LabelChip } from './LabelChip'

/**
 * Props for the LabelPicker component.
 */
interface LabelPickerProps extends YStackProps {
  /** Currently selected label IDs */
  selectedLabelIds: number[]
  /** Callback when selection changes */
  onSelectionChange: (labelIds: number[]) => void
}

/**
 * A label picker for selecting labels during contact creation.
 *
 * Unlike LabelSelector (which manages labels for existing contacts),
 * this component tracks selection locally and reports changes via callback.
 *
 * @example
 * ```tsx
 * const [selectedLabels, setSelectedLabels] = useState<number[]>([])
 *
 * <LabelPicker
 *   selectedLabelIds={selectedLabels}
 *   onSelectionChange={setSelectedLabels}
 * />
 * ```
 */
export const LabelPicker = memo(function LabelPicker({
  selectedLabelIds,
  onSelectionChange,
  ...rest
}: LabelPickerProps) {
  // Fetch all labels
  const { data: labels, isLoading: isLoadingLabels } = useContactLabels()

  // Create label mutation
  const { mutate: createLabel, isPending: isCreating } = useCreateContactLabel()

  // Local state for new label input
  const [newLabelName, setNewLabelName] = useState('')
  const [showNewLabelInput, setShowNewLabelInput] = useState(false)

  // Convert selected label IDs to a Set for fast lookup
  const selectedSet = useMemo(() => new Set(selectedLabelIds), [selectedLabelIds])

  // Handle toggling a label selection
  const handleLabelPress = useCallback(
    (label: ContactLabel) => {
      const isSelected = selectedSet.has(label.id)

      if (isSelected) {
        onSelectionChange(selectedLabelIds.filter((id) => id !== label.id))
      } else {
        onSelectionChange([...selectedLabelIds, label.id])
      }
    },
    [selectedLabelIds, selectedSet, onSelectionChange]
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
          // Select the new label
          onSelectionChange([...selectedLabelIds, newLabel.id])
        },
      }
    )
  }, [newLabelName, createLabel, selectedLabelIds, onSelectionChange])

  // Handle canceling new label creation
  const handleCancelCreate = useCallback(() => {
    setNewLabelName('')
    setShowNewLabelInput(false)
  }, [])

  if (isLoadingLabels) {
    return (
      <YStack padding="$3" alignItems="center" {...rest}>
        <Spinner size="small" />
      </YStack>
    )
  }

  return (
    <YStack testID="labelPickerSection" gap="$3" {...rest}>
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph fontWeight="600" color="$color11">
          Labels
        </Paragraph>
        {!showNewLabelInput && (
          <Button
            testID="labelPickerNewButton"
            size="$2"
            chromeless
            onPress={() => setShowNewLabelInput(true)}
            disabled={isCreating}
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
            testID="labelPickerNameInput"
            flex={1}
            size="$3"
            placeholder="Label name"
            placeholderTextColor="$color10"
            value={newLabelName}
            onChangeText={setNewLabelName}
            maxLength={CONTACTS_LABEL_NAME_MAX}
            autoFocus
            onSubmitEditing={handleCreateLabel}
          />
          <Button
            testID="labelPickerAddButton"
            size="$3"
            theme="green"
            onPress={handleCreateLabel}
            disabled={
              newLabelName.trim().length === 0 ||
              newLabelName.length > CONTACTS_LABEL_NAME_MAX ||
              isCreating
            }
          >
            {isCreating ? <Spinner size="small" /> : <Button.Text color="$black">Add</Button.Text>}
          </Button>
          <Button
            testID="labelPickerCancelButton"
            size="$3"
            chromeless
            onPress={handleCancelCreate}
          >
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
              selected={selectedSet.has(label.id)}
              onPress={handleLabelPress}
              opacity={isCreating ? 0.6 : 1}
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
