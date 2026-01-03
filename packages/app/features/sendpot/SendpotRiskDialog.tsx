import {
  Button,
  Checkbox,
  Dialog,
  H2,
  Label,
  Paragraph,
  Sheet,
  XStack,
  YStack,
  Anchor,
} from '@my/ui'
import { Check } from '@tamagui/lucide-icons'

import { toNiceError } from 'app/utils/toNiceError'
import { useEffect, useId, useState, useRef } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'

import { useQueryClient } from '@tanstack/react-query'
import {
  useDidUserBuyTicket,
  SENDPOT_DISCLAIMER_ACCEPTED_QUERY_KEY,
} from './hooks/useDidUserBuyTicket'

import { useTranslation } from 'react-i18next'
import { useAnalytics } from 'app/provider/analytics'

const SendpotRiskDialog = () => {
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const didUserBuyTicket = useDidUserBuyTicket()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = useId()
  const { t } = useTranslation('sendpot')
  const analytics = useAnalytics()
  const hasTrackedView = useRef(false)

  const handleConfirm = () => {
    // Track disclaimer accepted
    analytics.capture({
      name: 'sendpot_disclaimer_accepted',
      properties: {},
    })
    // Set the disclaimer accepted flag in the query cache
    queryClient.setQueryData([SENDPOT_DISCLAIMER_ACCEPTED_QUERY_KEY], true)
    setIsOpen(false)
  }

  const handleClose = () => {
    router.back()
  }

  useEffect(() => {
    if (didUserBuyTicket.data === false || didUserBuyTicket.error) {
      setIsOpen(true)
      // Track disclaimer viewed (only once per session)
      if (!hasTrackedView.current) {
        analytics.capture({
          name: 'sendpot_disclaimer_viewed',
          properties: {},
        })
        hasTrackedView.current = true
      }
    }
  }, [didUserBuyTicket.data, didUserBuyTicket.error, analytics])

  // Shared content component to avoid duplication
  const dialogContent = (
    <>
      {didUserBuyTicket.error ? (
        <YStack gap="$4">
          <H2>{t('risk.errorTitle')}</H2>
          <Paragraph>{toNiceError(didUserBuyTicket.error)}</Paragraph>
        </YStack>
      ) : (
        <YStack gap="$4" testID={'sendpotRiskDialogContent'}>
          <H2>{t('risk.title')}</H2>
          <Paragraph>
            {t('risk.body')}{' '}
            <Anchor
              target="_blank"
              href="https://support.send.app/en/articles/10916009-terms-of-service"
              rel="noreferrer"
              textDecorationLine={'underline'}
            >
              {t('risk.link')}
            </Anchor>
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
              backgroundColor={isChecked ? '$primary' : '$color1'}
              circular={true}
              focusStyle={{ outlineWidth: 0 }}
              elevation={3}
            >
              <Checkbox.Indicator>
                <Check color={'$black'} />
              </Checkbox.Indicator>
            </Checkbox>
            <Label htmlFor={id} cursor={'pointer'}>
              {t('risk.checkbox')}
            </Label>
          </XStack>
          <XStack justifyContent="flex-end" gap="$4">
            {Platform.OS === 'web' && (
              <Dialog.Close asChild>
                <Button theme="red_active" br={'$2'}>
                  <Button.Text>{t('risk.actions.cancel')}</Button.Text>
                </Button>
              </Dialog.Close>
            )}
            <Button
              testID={'sendpotRiskDialogContinueButton'}
              theme="green"
              onPress={handleConfirm}
              br={'$2'}
              disabled={!isChecked}
              disabledStyle={{ opacity: 0.5 }}
              width={Platform.OS === 'web' ? undefined : '100%'}
            >
              <Button.Text color="$color0" $theme-light={{ color: '$color12' }}>
                {t('risk.actions.confirm')}
              </Button.Text>
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
            key="sendpot-risk-dialog"
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
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="sendpot-risk-sheet" gap="$4" padding="$4" pb={'$6'}>
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

export default SendpotRiskDialog
