import {
  Button,
  Dialog,
  H4,
  Input,
  Paragraph,
  Sheet,
  Spinner,
  Text,
  VisuallyHidden,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import { IconPlus, IconTrash, IconX } from 'app/components/icons'
import { Pencil } from '@tamagui/lucide-icons'
import { memo, useCallback, useState } from 'react'
import { Platform } from 'react-native'
import { CONTACTS_LABEL_NAME_MAX } from '../constants'
import {
  useContactLabels,
  useCreateContactLabel,
  useDeleteContactLabel,
  useUpdateContactLabel,
} from '../hooks/useContactLabels'
import type { ContactLabel } from '../types'

/**
 * Props for the LabelManagerSheet component.
 */
interface LabelManagerSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * Sheet for managing contact labels.
 *
 * Features:
 * - Create new labels
 * - Delete existing labels
 * - View all user labels
 *
 * @example
 * ```tsx
 * <LabelManagerSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export const LabelManagerSheet = memo(function LabelManagerSheet({
  open,
  onOpenChange,
}: LabelManagerSheetProps) {
  const toast = useAppToast()

  // Form state
  const [newLabelName, setNewLabelName] = useState('')

  // Data and mutations
  const { data: labels, isLoading: isLoadingLabels } = useContactLabels()
  const { mutate: createLabel, isPending: isCreating } = useCreateContactLabel()
  const { mutate: updateLabel, isPending: isUpdating } = useUpdateContactLabel()
  const { mutate: deleteLabel, isPending: isDeleting } = useDeleteContactLabel()

  // Handle create label
  const handleCreateLabel = useCallback(() => {
    const trimmedName = newLabelName.trim()
    if (!trimmedName) return

    createLabel(
      { name: trimmedName },
      {
        onSuccess: () => {
          toast.show('Label created')
          setNewLabelName('')
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }, [newLabelName, createLabel, toast])

  // Handle update label
  const handleUpdateLabel = useCallback(
    (label: ContactLabel, newName: string) => {
      updateLabel(
        { labelId: label.id, name: newName },
        {
          onSuccess: () => {
            toast.show(`Label renamed to "${newName}"`)
          },
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    },
    [updateLabel, toast]
  )

  // Handle delete label
  const handleDeleteLabel = useCallback(
    (label: ContactLabel) => {
      deleteLabel(
        { labelId: label.id },
        {
          onSuccess: () => {
            toast.show(`Label "${label.name}" deleted`)
          },
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    },
    [deleteLabel, toast]
  )

  // Handle close
  const handleClose = useCallback(() => {
    setNewLabelName('')
    onOpenChange(false)
  }, [onOpenChange])

  const isAddDisabled = !newLabelName.trim() || isCreating

  // Sheet content
  const sheetContent = (
    <YStack gap="$4" padding="$4" pb="$6">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <H4>Manage Labels</H4>
        <Button
          size="$3"
          circular
          chromeless
          onPress={handleClose}
          icon={<IconX size={20} color="$color12" />}
        />
      </XStack>

      {/* Create new label */}
      <YStack gap="$2">
        <Text fontWeight="600" color="$color11">
          Create New Label
        </Text>
        <XStack gap="$2">
          <Input
            flex={1}
            size="$4"
            placeholder="Label name"
            placeholderTextColor="$color10"
            value={newLabelName}
            onChangeText={setNewLabelName}
            maxLength={CONTACTS_LABEL_NAME_MAX}
            autoCapitalize="none"
            onSubmitEditing={handleCreateLabel}
          />
          <Button
            size="$4"
            theme="green"
            onPress={handleCreateLabel}
            disabled={isAddDisabled}
            icon={isCreating ? <Spinner size="small" /> : <IconPlus size={16} color="$black" />}
          >
            <Button.Text color="$black">Add</Button.Text>
          </Button>
        </XStack>
      </YStack>

      {/* Existing labels */}
      <YStack gap="$2">
        <Text fontWeight="600" color="$color11">
          Your Labels
        </Text>

        {isLoadingLabels ? (
          <XStack padding="$4" justifyContent="center">
            <Spinner />
          </XStack>
        ) : labels && labels.length > 0 ? (
          <YStack gap="$2">
            {labels.map((label) => (
              <LabelRow
                key={label.id}
                label={label}
                onUpdate={handleUpdateLabel}
                onDelete={handleDeleteLabel}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
              />
            ))}
          </YStack>
        ) : (
          <Paragraph color="$color10" textAlign="center" padding="$4">
            No labels yet. Create one above!
          </Paragraph>
        )}
      </YStack>
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
            maxWidth={400}
            overflow="hidden"
          >
            <VisuallyHidden>
              <Dialog.Title>Manage Labels</Dialog.Title>
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
      dismissOnOverlayPress
      native
      snapPoints={[70]}
    >
      <Sheet.Frame key="label-manager-sheet">
        <Sheet.ScrollView>{sheetContent}</Sheet.ScrollView>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
})

/**
 * Props for LabelRow component.
 */
interface LabelRowProps {
  label: ContactLabel
  onUpdate: (label: ContactLabel, newName: string) => void
  onDelete: (label: ContactLabel) => void
  isUpdating: boolean
  isDeleting: boolean
}

/**
 * Row displaying a single label with edit and delete actions.
 */
const LabelRow = memo(function LabelRow({
  label,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: LabelRowProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [editName, setEditName] = useState(label.name)

  const handleEditClick = useCallback(() => {
    setEditName(label.name)
    setMode('edit')
  }, [label.name])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== label.name) {
      onUpdate(label, trimmed)
    }
    setMode('view')
  }, [editName, label, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditName(label.name)
    setMode('view')
  }, [label.name])

  const handleDeleteClick = useCallback(() => {
    if (mode === 'delete') {
      onDelete(label)
      setMode('view')
    } else {
      setMode('delete')
    }
  }, [mode, label, onDelete])

  const handleCancelDelete = useCallback(() => {
    setMode('view')
  }, [])

  // Edit mode
  if (mode === 'edit') {
    return (
      <XStack backgroundColor="$color2" borderRadius="$3" padding="$3" alignItems="center" gap="$2">
        <Input
          flex={1}
          size="$3"
          value={editName}
          onChangeText={setEditName}
          maxLength={CONTACTS_LABEL_NAME_MAX}
          autoFocus
          onSubmitEditing={handleSaveEdit}
        />
        <Button size="$2" chromeless onPress={handleCancelEdit}>
          <Button.Text>Cancel</Button.Text>
        </Button>
        <Button
          size="$2"
          theme="green"
          onPress={handleSaveEdit}
          disabled={!editName.trim() || isUpdating}
          icon={isUpdating ? <Spinner size="small" /> : undefined}
        >
          <Button.Text color="$black">Save</Button.Text>
        </Button>
      </XStack>
    )
  }

  // Delete confirmation mode
  if (mode === 'delete') {
    return (
      <XStack
        backgroundColor="$color2"
        borderRadius="$3"
        padding="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontSize="$4" color="$color12">
          {label.name}
        </Text>
        <XStack gap="$2">
          <Button size="$2" chromeless onPress={handleCancelDelete}>
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button
            size="$2"
            backgroundColor="$red9"
            onPress={handleDeleteClick}
            disabled={isDeleting}
            icon={isDeleting ? <Spinner size="small" /> : undefined}
          >
            <Button.Text color="$white">Delete</Button.Text>
          </Button>
        </XStack>
      </XStack>
    )
  }

  // Default view mode
  return (
    <XStack
      backgroundColor="$color2"
      borderRadius="$3"
      padding="$3"
      alignItems="center"
      justifyContent="space-between"
    >
      <Text fontSize="$4" color="$color12">
        {label.name}
      </Text>
      <XStack gap="$1">
        <Button
          size="$2"
          chromeless
          onPress={handleEditClick}
          icon={<Pencil size={16} color="$color11" />}
        />
        <Button
          size="$2"
          chromeless
          onPress={handleDeleteClick}
          icon={<IconTrash size={16} color="$red10" />}
        />
      </XStack>
    </XStack>
  )
})

export default LabelManagerSheet
