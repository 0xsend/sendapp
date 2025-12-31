import { Button, H4, XStack } from '@my/ui'
import { IconX } from 'app/components/icons'
import { memo } from 'react'
import { useContactDetail } from './ContactDetailContext'

/**
 * Header section with title and close button.
 */
export const ContactDetailHeader = memo(function ContactDetailHeader() {
  const { close } = useContactDetail()

  return (
    <XStack justifyContent="space-between" alignItems="center">
      <H4>Contact Details</H4>
      <Button
        size="$3"
        circular
        chromeless
        onPress={close}
        icon={<IconX size={20} color="$color12" />}
      />
    </XStack>
  )
})
