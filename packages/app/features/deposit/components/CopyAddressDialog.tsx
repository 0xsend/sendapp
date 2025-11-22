import { Anchor, Button, Dialog, Paragraph, PrimaryButton, Sheet, YStack } from '@my/ui'
import { allCoins } from 'app/data/coins'
import { Platform } from 'react-native'
import { Trans, useTranslation } from 'react-i18next'

export function CopyAddressDialog({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation('deposit')
  const coinsList = allCoins.map((coin) => coin.symbol).join(', ')

  const steps = [
    {
      key: 'base-network',
      content: (
        <Trans
          t={t}
          i18nKey="copyAddressDialog.steps.baseNetwork"
          components={{
            supportLink: (
              <Anchor
                target="_blank"
                href="https://support.send.app/en/articles/9809554-smart-contract-deposit-issue"
                rel="noreferrer"
                textDecorationLine={'underline'}
              />
            ),
          }}
        />
      ),
    },
    {
      key: 'tokens',
      content: t('copyAddressDialog.steps.tokens', { coins: coinsList }),
    },
    {
      key: 'liability',
      content: t('copyAddressDialog.steps.liability'),
    },
  ]

  const dialogContent = (
    <>
      <Paragraph size={'$8'} fontWeight={600} ta={'center'}>
        {t('copyAddressDialog.title')}
      </Paragraph>
      <Paragraph color={'$lightGrayTextField'} $theme-light={{ color: '$darkGrayTextField' }}>
        {t('copyAddressDialog.intro')}
      </Paragraph>
      {steps.map((step, index) => (
        <Paragraph
          key={`copy-address-step-${step.key}`}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          {index + 1}. {step.content}
        </Paragraph>
      ))}
      <YStack justifyContent="space-between" marginTop="$4" gap="$4">
        <PrimaryButton onPress={onConfirm} focusStyle={{ outlineWidth: 0 }}>
          <PrimaryButton.Text>{t('copyAddressDialog.actions.confirm')}</PrimaryButton.Text>
        </PrimaryButton>
        {Platform.OS === 'web' && (
          <Dialog.Close asChild>
            <Button borderRadius={'$4'} p={'$4'} focusStyle={{ outlineWidth: 0 }}>
              <Button.Text fontWeight={'500'} tt="uppercase" size={'$4'}>
                {t('copyAddressDialog.actions.cancel')}
              </Button.Text>
            </Button>
          </Dialog.Close>
        )}
      </YStack>
    </>
  )

  if (Platform.OS === 'web') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            width={'85%'}
            br={'$5'}
            p={'$5'}
            gap={'$3.5'}
            maxWidth={400}
            $gtLg={{ p: '$7', gap: '$5' }}
          >
            {dialogContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    )
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={onClose}
      modal
      dismissOnSnapToBottom
      dismissOnOverlayPress
      native
      snapPoints={['fit']}
      snapPointsMode="fit"
    >
      <Sheet.Frame key="copy-address-sheet" gap="$3.5" padding="$6">
        {dialogContent}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
