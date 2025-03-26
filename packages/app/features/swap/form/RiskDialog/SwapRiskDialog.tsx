import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Dialog, Paragraph, Sheet, XStack, YStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useDidUserSwap } from 'app/features/swap/hooks/useDidUserSwap'

const SwapRiskDialog = () => {
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { data: didUserSwap } = useDidUserSwap()
  const router = useRouter()

  const handleConfirm = () => {
    setIsOpen(false)
  }

  const handleClose = () => {
    router.back()
  }

  useEffect(() => {
    if (didUserSwap === false) {
      setIsOpen(true)
    }
  }, [didUserSwap])

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
        <Dialog.Content
          testID={'swapRiskDialogContent'}
          gap="$4"
          maxWidth={'90%'}
          $gtMd={{ maxWidth: '40%' }}
        >
          <YStack gap="$4">
            <Dialog.Title>Important Disclaimer</Dialog.Title>
            <Paragraph>
              Trading cryptocurrencies involves a high level of risk and may not be suitable for all
              investors. You could lose some or all of your principal, and should only invest money
              you can afford to lose. Carefully consider your investment objectives, experience, and
              risk tolerance before proceeding.{' '}
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
                testID={'swapRiskDialogCheckbox'}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  setIsChecked(checked === true)
                }}
                borderWidth={0}
                backgroundColor={isChecked ? '$primary' : '$background'}
                circular={true}
              >
                <Checkbox.Indicator>
                  <Check color={'$black'} />
                </Checkbox.Indicator>
              </Checkbox>
              <Paragraph>I have read and understand the risks involved.</Paragraph>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default SwapRiskDialog
