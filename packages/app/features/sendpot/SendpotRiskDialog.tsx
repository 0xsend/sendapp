import { Button, Checkbox, Dialog, Label, Paragraph, XStack, YStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'

import { toNiceError } from 'app/utils/toNiceError'
import { useEffect, useId, useState } from 'react'
import { useRouter } from 'solito/router'
import { useDidUserBuyTicket } from './hooks/useDidUserBuyTicket'

const SendpotRiskDialog = () => {
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const didUserBuyTicket = useDidUserBuyTicket()
  const router = useRouter()
  const id = useId()

  const handleConfirm = () => {
    setIsOpen(false)
  }

  const handleClose = () => {
    router.back()
  }

  useEffect(() => {
    if (didUserBuyTicket.data === false || didUserBuyTicket.error) {
      setIsOpen(true)
    }
  }, [didUserBuyTicket.data, didUserBuyTicket.error])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          key="sendpot-risk-dialog"
          gap="$4"
          maxWidth={'90%'}
          $gtMd={{ maxWidth: '40%' }}
        >
          {didUserBuyTicket.error ? (
            <YStack gap="$4">
              <Dialog.Title>Error</Dialog.Title>
              <Paragraph>{toNiceError(didUserBuyTicket.error)}</Paragraph>
            </YStack>
          ) : (
            <YStack gap="$4" testID={'sendpotRiskDialogContent'}>
              <Dialog.Title>Important Disclaimer</Dialog.Title>
              <Paragraph>
                By purchasing a Sendpot ticket, you acknowledge that winnings are not guaranteed and
                ticket costs are non-refundable. Draws are powered by Megapot and use provably fair
                onchain randomness—please play responsibly.{' '}
                <a
                  target="_blank"
                  href="https://support.send.app/en/articles/10916009-terms-of-service"
                  rel="noreferrer"
                >
                  Learn more.
                </a>
              </Paragraph>
              <XStack ai={'center'} gap={'$2'}>
                <Checkbox
                  id={id}
                  testID={'sendpotRiskDialogCheckbox'}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    setIsChecked(checked === true)
                  }}
                  borderWidth={0}
                  backgroundColor={isChecked ? '$primary' : '$background'}
                  circular={true}
                  focusStyle={{ outlineWidth: 0 }}
                >
                  <Checkbox.Indicator>
                    <Check color={'$black'} />
                  </Checkbox.Indicator>
                </Checkbox>
                <Label htmlFor={id} cursor={'pointer'}>
                  I have read and understand the terms.
                </Label>
              </XStack>
              <XStack justifyContent="flex-end" marginTop="$4" gap="$4">
                <Dialog.Close asChild>
                  <Button theme="red_active" br={'$2'}>
                    <Button.Text>Cancel</Button.Text>
                  </Button>
                </Dialog.Close>
                <Button
                  testID={'sendpotRiskDialogContinueButton'}
                  theme="green"
                  onPress={handleConfirm}
                  br={'$2'}
                  disabled={!isChecked}
                  disabledStyle={{ opacity: 0.5 }}
                >
                  <Button.Text color="$color0" $theme-light={{ color: '$color12' }}>
                    I Agree & Continue
                  </Button.Text>
                </Button>
              </XStack>
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default SendpotRiskDialog
