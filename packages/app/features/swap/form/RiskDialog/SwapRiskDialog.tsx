import {
  Anchor,
  Button,
  Checkbox,
  Dialog,
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
        <YStack gap="$3">
          <Dialog.Title>{t('risk.errorTitle')}</Dialog.Title>
          <Paragraph size="$4">{toNiceError(didUserSwap.error)}</Paragraph>
        </YStack>
      ) : (
        <YStack p="$2" gap="$3.5" testID={'swapRiskDialogContent'}>
          <Paragraph size="$7" fontWeight="600">
            {t('risk.title')}
          </Paragraph>
          <Paragraph color="$gray11" size="$4">
            {t('risk.description')}{' '}
            <Anchor
              target="_blank"
              href="https://support.send.app/en/articles/10916009-terms-of-service"
              rel="noreferrer"
              textDecorationLine={'underline'}
              size="$4"
            >
              {t('risk.learnMore')}
            </Anchor>
          </Paragraph>
          <Spacer size="$1" />
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
              size="$1"
            >
              <Checkbox.Indicator>
                <Check color={'$black'} size={14} />
              </Checkbox.Indicator>
            </Checkbox>
            <Label size="$4" htmlFor={id} cursor={'pointer'} lineHeight={18}>
              {t('risk.checkbox')}
            </Label>
          </XStack>
          <XStack justifyContent="flex-end" marginTop="$3" gap="$3">
            {Platform.OS === 'web' && (
              <Dialog.Close asChild>
                <Button testID={'swapRiskDialogCancelButton'} br={'$2'} size="$3">
                  <Button.Text size="$3">{t('risk.buttons.cancel')}</Button.Text>
                </Button>
              </Dialog.Close>
            )}
            <Button
              themeInverse
              testID={'swapRiskDialogContinueButton'}
              onPress={handleConfirm}
              br={'$2'}
              size="$3"
              disabled={!isChecked}
              disabledStyle={{ opacity: 0.5 }}
              width={Platform.OS === 'web' ? undefined : '100%'}
            >
              <Button.Text size="$3">{t('risk.buttons.confirm')}</Button.Text>
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
          <Dialog.Overlay
            animation="responsive"
            animateOnly={['opacity']}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            key="swap-risk-dialog"
            gap="$3"
            w={420}
            maxWidth={'90%'}
            $gtMd={{ maxWidth: '30%' }}
            bg="$aztec1"
            p="$4"
            animation="responsive"
            animateOnly={['transform', 'opacity']}
            exitStyle={{ x: 0, y: 20, opacity: 0, scale: 0.95 }}
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
      <Sheet.Frame key="swap-risk-sheet" gap="$3" padding="$3" pb={'$5'}>
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

export default SwapRiskDialog
