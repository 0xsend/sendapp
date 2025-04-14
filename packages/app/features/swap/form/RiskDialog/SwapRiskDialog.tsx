import { Button, Checkbox, Dialog, Paragraph, Sheet, XStack, YStack, Label } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useDidUserSwap } from 'app/features/swap/hooks/useDidUserSwap'
import { toNiceError } from 'app/utils/toNiceError'
import { useEffect, useId, useState } from 'react'
import { useRouter } from 'solito/router'

const SwapRiskDialog = () => {
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const didUserSwap = useDidUserSwap()
  const router = useRouter()
  const id = useId()

  const handleConfirm = () => {
    setIsOpen(false)
  }

  const handleClose = () => {
    router.back()
  }

  useEffect(() => {
    if (didUserSwap.data === false || didUserSwap.error) {
      setIsOpen(true)
    }
  }, [didUserSwap.data, didUserSwap.error])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom open={isOpen} onOpenChange={handleClose}>
          <Sheet.Frame padding="$4">
            <Dialog.Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Dialog.Adapt>

      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content gap="$4" maxWidth={'90%'} $gtMd={{ maxWidth: '40%' }}>
          {didUserSwap.error ? (
            <YStack gap="$4">
              <Dialog.Title>Error</Dialog.Title>
              <Paragraph>{toNiceError(didUserSwap.error)}</Paragraph>
            </YStack>
          ) : (
            <YStack gap="$4" testID={'swapRiskDialogContent'}>
              <Dialog.Title>Important Disclaimer</Dialog.Title>
              <Paragraph>
                Trading cryptocurrencies involves a high level of risk and may not be suitable for
                all investors. You could lose some or all of your principal, and should only invest
                money you can afford to lose. Carefully consider your investment objectives,
                experience, and risk tolerance before proceeding.{' '}
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
                  testID={'swapRiskDialogCheckbox'}
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
                  I have read and understand the risks involved.
                </Label>
              </XStack>
              <XStack justifyContent="flex-end" marginTop="$4" gap="$4">
                <Dialog.Close asChild>
                  <Button testID={'swapRiskDialogCancelButton'} br={'$2'}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  testID={'swapRiskDialogContinueButton'}
                  theme="green"
                  onPress={handleConfirm}
                  br={'$2'}
                  disabled={!isChecked}
                  disabledStyle={{ opacity: 0.5 }}
                >
                  <Button.Text>Continue</Button.Text>
                </Button>
              </XStack>
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default SwapRiskDialog
