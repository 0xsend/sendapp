import {
  Anchor,
  Button,
  Checkbox,
  Dialog,
  H2,
  Label,
  Paragraph,
  Sheet,
  Spacer,
  XStack,
  YStack,
} from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useDidUserSwap } from 'app/features/swap/hooks/useDidUserSwap'
import { toNiceError } from 'app/utils/toNiceError'
import { useEffect, useId, useState, useRef } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from 'app/provider/analytics'

const SwapRiskDialog = () => {
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)
  const didUserSwap = useDidUserSwap()
  const router = useRouter()
  const id = useId()
  const { t } = useTranslation('trade')
  const analytics = useAnalytics()
  const hasTrackedView = useRef(false)

  const handleConfirm = () => {
    // Track disclaimer accepted
    analytics.capture({
      name: 'swap_disclaimer_accepted',
      properties: {},
    })
    setIsOpen(false)
    setIsConfirmed(true)
  }

  const handleClose = () => {
    router.back()
  }

  useEffect(() => {
    // Don't show dialog while loading or refetching
    // This prevents flash when returning from a completed swap with stale cache
    if (didUserSwap.isLoading || didUserSwap.isFetching) {
      return
    }

    // Show dialog only if:
    // 1. User hasn't confirmed in this session AND
    // 2. User hasn't swapped before (data === false) OR there's an error
    if (!isConfirmed && (didUserSwap.data === false || didUserSwap.error)) {
      setIsOpen(true)
      // Track disclaimer viewed (only once per session)
      if (!hasTrackedView.current) {
        analytics.capture({
          name: 'swap_disclaimer_viewed',
          properties: {},
        })
        hasTrackedView.current = true
      }
    }
    // Close dialog if user has swapped before (even if they confirmed in this session)
    if (didUserSwap.data === true) {
      setIsOpen(false)
    }
  }, [
    didUserSwap.data,
    didUserSwap.error,
    didUserSwap.isLoading,
    didUserSwap.isFetching,
    isConfirmed,
    analytics,
  ])

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      {didUserSwap.error ? (
        <YStack gap="$4">
          <Dialog.Title>{t('risk.errorTitle')}</Dialog.Title>
          <Paragraph>{toNiceError(didUserSwap.error)}</Paragraph>
        </YStack>
      ) : (
        <YStack gap="$4" testID={'swapRiskDialogContent'}>
          <H2>{t('risk.title')}</H2>
          <Paragraph color="$gray11" size="$6">
            {t('risk.description')}{' '}
            <Anchor
              target="_blank"
              href="https://support.send.app/en/articles/10916009-terms-of-service"
              rel="noreferrer"
              textDecorationLine={'underline'}
            >
              {t('risk.learnMore')}
            </Anchor>
          </Paragraph>
          <Spacer />
          <XStack ai={'center'} gap={'$2'}>
            <Checkbox
              id={id}
              testID={'swapRiskDialogCheckbox'}
              checked={isChecked}
              onCheckedChange={(checked) => {
                setIsChecked(checked === true)
              }}
              backgroundColor={isChecked ? '$primary' : '$color1'}
              circular={true}
              focusStyle={{ outlineWidth: 0 }}
              bw={2}
              boc="$aztec6"
              size="$2"
            >
              <Checkbox.Indicator>
                <Check color={'$black'} />
              </Checkbox.Indicator>
            </Checkbox>
            <Label size="$6" htmlFor={id} cursor={'pointer'} lineHeight={20}>
              {t('risk.checkbox')}
            </Label>
          </XStack>
          <XStack justifyContent="flex-end" marginTop="$4" gap="$4">
            {Platform.OS === 'web' && (
              <Dialog.Close asChild>
                <Button testID={'swapRiskDialogCancelButton'} br={'$2'}>
                  <Button.Text>{t('risk.buttons.cancel')}</Button.Text>
                </Button>
              </Dialog.Close>
            )}
            <Button
              themeInverse
              testID={'swapRiskDialogContinueButton'}
              onPress={handleConfirm}
              br={'$2'}
              disabled={!isChecked}
              disabledStyle={{ opacity: 0.5 }}
              width={Platform.OS === 'web' ? undefined : '100%'}
            >
              <Button.Text>{t('risk.buttons.confirm')}</Button.Text>
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
            w={600}
            maxWidth={'90%'}
            $gtMd={{ maxWidth: '40%' }}
            bg="$aztec1"
            p="$6"
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
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="swap-risk-sheet" gap="$4" padding="$4" pb={'$6'}>
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

export default SwapRiskDialog
