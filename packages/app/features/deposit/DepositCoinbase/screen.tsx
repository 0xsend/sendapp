import { useSendAccount } from 'app/utils/send-accounts'
import useCoinbaseOnramp from 'app/utils/useCoinbaseOnramp'
import { toNiceError } from 'app/utils/toNiceError'
import { Button, FadeCard, Paragraph, PrimaryButton, Spinner, YStack } from '@my/ui'
import { IconError } from 'app/components/icons'
import { useThemeSetting } from '@tamagui/next-theme'
import { CoinbaseOnrampVerifyScreen } from '../components/CoinbaseOnrampVerifyScreen'
import { useRouter } from 'solito/router'
import { useEffect, useState } from 'react'
import { DepositCoinbaseForm } from 'app/features/deposit/DepositCoinbase/DepositCoinbaseForm'
import { Platform } from 'react-native'
import { useTranslation } from 'react-i18next'

interface DepositCoinbaseScreenProps {
  defaultPaymentMethod?: 'APPLE_PAY' | 'CARD'
}

export function DepositCoinbaseScreen({ defaultPaymentMethod }: DepositCoinbaseScreenProps) {
  const router = useRouter()
  const { data: sendAccount } = useSendAccount()
  const {
    openOnramp,
    closeOnramp,
    status: coinbaseStatus,
    error,
    isLoading,
  } = useCoinbaseOnramp({
    address: sendAccount?.address ?? '',
    partnerUserId: sendAccount?.user_id ?? '',
    defaultPaymentMethod,
  })
  // Track transaction status
  const [status, setStatus] = useState<'idle' | 'failure'>('idle')
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const { t } = useTranslation('deposit')

  // Web-only: detect iOS Safari to guide users when popups are blocked
  const niceError = error ? toNiceError(error) : null
  const isIOSWeb =
    (Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent)) ||
    Platform.OS === 'ios'
  const shouldShowIOSPopupHelp = Boolean(
    isIOSWeb && niceError && /popup was blocked/i.test(niceError)
  )

  const handleConfirmTransaction = (amount: number) => {
    openOnramp(amount)
  }

  useEffect(() => {
    if (coinbaseStatus === 'success' && Platform.OS === 'web') {
      router.push('/deposit/success')
    }
  }, [coinbaseStatus, router])

  const renderContent = () => {
    switch (true) {
      case !!error:
        return (
          <>
            <FadeCard ai={'center'} testID="error">
              <IconError size={'$4'} color={'$error'} />
              <YStack ai={'center'} gap={'$2'}>
                <Paragraph size={'$8'} fontWeight={500} ta={'center'}>
                  {t('coinbase.errors.windowClosed')}
                </Paragraph>
                <Paragraph
                  size={'$5'}
                  ta={'center'}
                  color={'$lightGrayTextField'}
                  $theme-light={{ color: '$darkGrayTextField' }}
                >
                  {niceError}
                </Paragraph>
              </YStack>
              <PrimaryButton onPress={closeOnramp}>
                <PrimaryButton.Text>{t('coinbase.actions.tryAgain')}</PrimaryButton.Text>
              </PrimaryButton>
            </FadeCard>
            {shouldShowIOSPopupHelp && (
              <Paragraph
                size={'$5'}
                ta={'center'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                {t('coinbase.help.iosPopup')}
              </Paragraph>
            )}
          </>
        )
      case coinbaseStatus === 'success':
        return (
          <FadeCard ai={'center'} testID="success">
            <Spinner size="large" color={isDarkTheme ? '$primary' : '$color12'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} $gtLg={{ size: '$9' }} ta={'center'}>
                {t('coinbase.status.almostThere.title')}
              </Paragraph>
              <Paragraph
                ta={'center'}
                size={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                {t('coinbase.status.almostThere.description')}
              </Paragraph>
            </YStack>
          </FadeCard>
        )
      case coinbaseStatus === 'payment_submitted':
        return (
          <CoinbaseOnrampVerifyScreen
            onFailure={() => setStatus('failure')}
            onSuccess={() => router.push('/deposit/success')}
          />
        )
      case coinbaseStatus === 'pending_payment':
        return (
          <FadeCard ai={'center'} testID="pending-payment">
            <Spinner size="large" color={isDarkTheme ? '$primary' : '$color12'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} ta={'center'} $gtLg={{ size: '$9' }}>
                {t('coinbase.status.holdTight.title')}
              </Paragraph>
              <Paragraph
                ta={'center'}
                size={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                {t('coinbase.status.holdTight.description')}
              </Paragraph>
            </YStack>
            <Button
              transparent
              chromeless
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ backgroundColor: 'transparent' }}
              focusStyle={{ backgroundColor: 'transparent' }}
              p={0}
              bw={0}
              height={'auto'}
              onPress={closeOnramp}
            >
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                hoverStyle={{ color: '$primary' }}
              >
                {t('coinbase.actions.cancel')}
              </Button.Text>
            </Button>
          </FadeCard>
        )
      case status === 'failure':
        return (
          <FadeCard ai={'center'} testID="failure">
            <IconError size={'$4'} color={'$error'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} ta={'center'} $gtLg={{ size: '$9' }}>
                {t('coinbase.status.timedOut.title')}
              </Paragraph>
              <Paragraph
                size={'$5'}
                ta={'center'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                {t('coinbase.status.timedOut.description')}
              </Paragraph>
            </YStack>
            <PrimaryButton onPress={closeOnramp}>
              <PrimaryButton.Text>{t('coinbase.actions.tryAgain')}</PrimaryButton.Text>
            </PrimaryButton>
          </FadeCard>
        )
      case coinbaseStatus === 'failed':
        return (
          <FadeCard ai={'center'} testID="coinbase-failure">
            <IconError size={'$4'} color={'$error'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} ta={'center'} $gtLg={{ size: '$9' }}>
                {t('coinbase.status.failed.title')}
              </Paragraph>
              <Paragraph
                size={'$5'}
                ta={'center'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                {t('coinbase.status.failed.description')}
              </Paragraph>
            </YStack>
            <PrimaryButton onPress={closeOnramp}>
              <PrimaryButton.Text>{t('coinbase.actions.tryAgain')}</PrimaryButton.Text>
            </PrimaryButton>
          </FadeCard>
        )
      default:
        return (
          <DepositCoinbaseForm
            onConfirmTransaction={handleConfirmTransaction}
            isLoading={isLoading}
          />
        )
    }
  }

  return (
    <YStack
      w={'100%'}
      gap="$5"
      py={'$3.5'}
      $gtLg={{
        w: '50%',
      }}
    >
      {renderContent()}
    </YStack>
  )
}
