import { Button, Spinner, XStack } from '@my/ui'
import { User } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { useContactDetail } from './ContactDetailContext'

/**
 * Action buttons section: edit/save/cancel, view profile, send.
 */
export const ContactDetailActions = memo(function ContactDetailActions() {
  const {
    isEditing,
    isUpdating,
    startEditing,
    handleSaveEdits,
    handleCancelEdits,
    hideNavButtons,
    canViewProfile,
    canSendMoney,
    handleViewProfile,
    handleSendMoney,
  } = useContactDetail()

  return (
    <>
      {/* Edit/Save buttons */}
      {isEditing ? (
        <XStack gap="$3">
          <Button flex={1} onPress={handleCancelEdits} disabled={isUpdating}>
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button
            flex={1}
            backgroundColor="$primary"
            onPress={handleSaveEdits}
            disabled={isUpdating}
            icon={isUpdating ? <Spinner size="small" color="$white" /> : undefined}
            hoverStyle={{ backgroundColor: '$color10' }}
          >
            <Button.Text color="$white">Save</Button.Text>
          </Button>
        </XStack>
      ) : (
        <Button onPress={startEditing}>
          <Button.Text>Edit Contact</Button.Text>
        </Button>
      )}

      {/* View Profile button - only for Send users, hidden when opened from profile */}
      {!hideNavButtons && canViewProfile && (
        <Button
          onPress={handleViewProfile}
          icon={<User size={18} color="$color12" />}
          testID="viewProfileButton"
        >
          <Button.Text>View Profile</Button.Text>
        </Button>
      )}

      {/* Send button - only for Send users or EVM external contacts, hidden when opened from profile */}
      {!hideNavButtons && canSendMoney && (
        <Button theme="green" onPress={handleSendMoney}>
          <Button.Text>Send</Button.Text>
        </Button>
      )}
    </>
  )
})
