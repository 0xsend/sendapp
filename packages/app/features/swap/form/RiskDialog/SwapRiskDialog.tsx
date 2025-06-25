import {
  Anchor,
  Button,
  Checkbox,
  Dialog,
  H2,
  Label,
  Paragraph,
  Sheet,
  XStack,
  YStack,
} from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useDidUserSwap } from 'app/features/swap/hooks/useDidUserSwap'
import { toNiceError } from 'app/utils/toNiceError'
import { useEffect, useId, useState } from 'react'
import { Platform } from 'react-native'
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

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      {didUserSwap.error ? (
        <YStack gap="$4">
          <Dialog.Title>Error</Dialog.Title>
          <Paragraph>{toNiceError(didUserSwap.error)}</Paragraph>
        </YStack>
      ) : (
        <YStack gap="$4" testID={'swapRiskDialogContent'}>
          <H2>Important Disclaimer</H2>
          <Paragraph>
            Trading cryptocurrencies involves a high level of risk and may not be suitable for all
            investors. You could lose some or all of your principal, and should only invest money
            you can afford to lose. Carefully consider your investment objectives, experience, and
            risk tolerance before proceeding.{' '}
            <Anchor
              target="_blank"
              href="https://support.send.app/en/articles/10916009-terms-of-service"
              rel="noreferrer"
              textDecorationLine={'underline'}
            >
              Learn more.
            </Anchor>
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
            <Label htmlFor={id} cursor={'pointer'} lineHeight={0}>
              I have read and understand the risks involved.
            </Label>
          </XStack>
          <XStack justifyContent="flex-end" marginTop="$4" gap="$4">
            {Platform.OS === 'web' && (
              <Dialog.Close asChild>
                <Button theme="red_active" testID={'swapRiskDialogCancelButton'} br={'$2'}>
                  <Button.Text>Cancel</Button.Text>
                </Button>
              </Dialog.Close>
            )}
            <Button
              testID={'swapRiskDialogContinueButton'}
              theme="green"
              onPress={handleConfirm}
              br={'$2'}
              disabled={!isChecked}
              disabledStyle={{ opacity: 0.5 }}
              width={Platform.OS === 'web' ? undefined : '100%'}
            >
              <Button.Text>I Agree & Continue</Button.Text>
            </Button>
          </XStack>
        </YStack>
      )}
    </>
  )

  // Web version using Dialog
  if (Platform.OS === 'web') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            key="swap-risk-dialog"
            gap="$4"
            maxWidth={'90%'}
            $gtMd={{ maxWidth: '40%' }}
          >
            {dialogContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  // Native version using Sheet
  return (
    <Sheet
      open={isOpen}
      onOpenChange={handleClose}
      modal
      dismissOnSnapToBottom
      dismissOnOverlayPress
      native
      snapPoints={[60]}
    >
      <Sheet.Frame key="swap-risk-sheet" gap="$4" padding="$4">
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

export default SwapRiskDialog
