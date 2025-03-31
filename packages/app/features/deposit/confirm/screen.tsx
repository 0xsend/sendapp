import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { toNiceError } from 'app/utils/toNiceError'
import { Button, FadeCard, Paragraph, Spinner, YStack } from '@my/ui'
import { DepositConfirm } from 'app/features/deposit/components/DepositConfirm'
import { IconError } from 'app/components/icons'
import { useThemeSetting } from '@tamagui/next-theme'
import { CoinbaseOnrampVerifyScreen } from '../components/CoinbaseOnrampVerifyScreen'
import { useRouter } from 'solito/router'
import { useEffect, useState } from 'react'

const COINBASE_APP_ID = process.env.NEXT_PUBLIC_CDP_APP_ID ?? ''

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
    projectId: COINBASE_APP_ID,
    address: sendAccount?.address ?? '',
    partnerUserId: sendAccount?.user_id ?? '',
    defaultPaymentMethod,
  })
  // Track transaction status
  const [status, setStatus] = useState<'idle' | 'failure'>('idle')
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')

  const handleConfirmTransaction = (amount: number) => {
    openOnramp(amount)
  }

  useEffect(() => {
    if (coinbaseStatus === 'success') {
      router.push('/deposit/success')
    }
  }, [coinbaseStatus, router.push])

  const renderContent = () => {
    switch (true) {
      case !!error:
        return (
          <FadeCard ai={'center'} testID="error">
            <IconError size={'$4'} color={'$error'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} ta={'center'}>
                Unable to Initialize Payment
              </Paragraph>
              <Paragraph
                size={'$5'}
                ta={'center'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                {toNiceError(error)}
              </Paragraph>
            </YStack>
            <Button theme="green" py={'$5'} br={'$4'} mt={'$4'} onPress={closeOnramp} w={'100%'}>
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
              >
                try again
              </Button.Text>
            </Button>
          </FadeCard>
        )
      case coinbaseStatus === 'success':
        return (
          <FadeCard ai={'center'} testID="success">
            <Spinner size="large" color={isDarkTheme ? '$primary' : '$color12'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} $gtLg={{ size: '$9' }} ta={'center'}>
                Almost there...
              </Paragraph>
              <Paragraph
                ta={'center'}
                size={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Just wrapping up the final steps.
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
                Hold tight...
              </Paragraph>
              <Paragraph
                ta={'center'}
                size={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Complete the transaction in your Coinbase window.
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
                cancel
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
                Transaction Timed Out
              </Paragraph>
              <Paragraph
                size={'$5'}
                ta={'center'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Your payment took too long to process. Please try again.
              </Paragraph>
            </YStack>
            <Button theme="green" py={'$5'} br={'$4'} mt={'$4'} onPress={closeOnramp} w={'100%'}>
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
              >
                try again
              </Button.Text>
            </Button>
          </FadeCard>
        )
      case coinbaseStatus === 'failed':
        return (
          <FadeCard ai={'center'} testID="coinbase-failure">
            <IconError size={'$4'} color={'$error'} />
            <YStack ai={'center'} gap={'$2'}>
              <Paragraph size={'$8'} fontWeight={500} ta={'center'} $gtLg={{ size: '$9' }}>
                Payment Failed
              </Paragraph>
              <Paragraph
                size={'$5'}
                ta={'center'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
              >
                Please check your connection or try a different card.
              </Paragraph>
            </YStack>
            <Button theme="green" py={'$5'} br={'$4'} mt={'$4'} onPress={closeOnramp} w={'100%'}>
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
              >
                try again
              </Button.Text>
            </Button>
          </FadeCard>
        )
      default:
        return (
          <DepositConfirm onConfirmTransaction={handleConfirmTransaction} isLoading={isLoading} />
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
