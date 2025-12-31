import { Paragraph, Text, TextArea, YStack } from '@my/ui'
import { memo } from 'react'
import { CONTACTS_NOTES_MAX } from '../constants'
import { useContactDetail } from './ContactDetailContext'

/**
 * Notes section with view/edit modes.
 */
export const ContactDetailNotes = memo(function ContactDetailNotes() {
  const { contact, isEditing, editState, updateEditField } = useContactDetail()

  return (
    <YStack gap="$2">
      <Text fontWeight="600" color="$color11">
        Notes
      </Text>
      {isEditing && editState ? (
        <TextArea
          value={editState.notes}
          onChangeText={(v) => updateEditField('notes', v)}
          placeholder="Add notes about this contact..."
          placeholderTextColor="$color10"
          maxLength={CONTACTS_NOTES_MAX}
          minHeight={80}
          color="$color12"
          backgroundColor="$color3"
          borderColor="$color6"
        />
      ) : (
        <Paragraph color={contact.notes ? '$color12' : '$color10'}>
          {contact.notes || 'No notes'}
        </Paragraph>
      )}
    </YStack>
  )
})
