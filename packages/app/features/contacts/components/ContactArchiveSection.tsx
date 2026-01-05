import { Button, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { IconTrash } from 'app/components/icons'
import { memo } from 'react'
import { useContactDetail } from './ContactDetailContext'

/**
 * Archive/restore section with confirmation dialog.
 */
export const ContactArchiveSection = memo(function ContactArchiveSection() {
  const {
    isEditing,
    isArchived,
    showArchiveConfirm,
    showConfirm,
    hideConfirm,
    handleArchiveToggle,
    isMutating,
  } = useContactDetail()

  // Don't show archive section in edit mode
  if (isEditing) {
    return null
  }

  return (
    <YStack gap="$2" paddingTop="$4" borderTopWidth={1} borderTopColor="$color4">
      {showArchiveConfirm ? (
        <YStack gap="$3">
          <Paragraph color="$color11" textAlign="center">
            {isArchived
              ? 'Restore this contact to your active list?'
              : 'Archive this contact? You can restore it later.'}
          </Paragraph>
          <XStack gap="$3">
            <Button flex={1} onPress={hideConfirm} disabled={isMutating}>
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
          onPress={showConfirm}
          icon={<IconTrash size={18} color={isArchived ? '$green10' : '$red10'} />}
        >
          <Button.Text color={isArchived ? '$green10' : '$red10'}>
            {isArchived ? 'Restore Contact' : 'Archive Contact'}
          </Button.Text>
        </Button>
      )}
    </YStack>
  )
})
