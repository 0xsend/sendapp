import { useState, useEffect } from 'react'
import { OnrampFlow } from 'app/features/deposit/components/OnrampFlow'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { toNiceError } from 'app/utils/toNiceError'
import { YStack, Text, Button, Spinner, Card, XStack, LinkableButton } from '@my/ui'
import { CoinbaseOnrampVerifyScreen } from '../components/CoinbaseOnrampVerifyScreen'
import { useRouter } from 'solito/router'

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
          <YStack width="100%" $gtSm={{ width: 600 }} gap="$4" testID="error">
            <Card bc="$color1" width="100%" p="$6">
              <YStack ai="center" gap="$4">
                <Text fontSize="$8" fontWeight="600" color="$red10" ta="center">
                  Coinbase window was closed.
                </Text>
                <Text color="$gray11" ta="center">
                  {toNiceError(error)}
                </Text>
                <Button
                  theme="green"
                  px="$3.5"
                  h="$4.5"
                  borderRadius="$4"
                  f={1}
                  onPress={closeOnramp}
                >
                  <XStack w="100%" gap="$2.5" ai="center" jc="center">
                    <LinkableButton.Text
                      fontWeight="500"
                      tt="uppercase"
                      $theme-dark={{ col: '$color0' }}
                    >
                      Try Again
                    </LinkableButton.Text>
                  </XStack>
                </Button>
              </YStack>
            </Card>
          </YStack>
        )

      case coinbaseStatus === 'success':
        return (
          <YStack width="100%" $gtSm={{ width: 600 }} gap="$4" testID="success">
            <Card bc="$color1" width="100%" p="$6">
              <YStack ai="center" gap="$4">
                <Spinner size="large" color="$primary" />
                <Text fontSize="$8" fontWeight="600" ta="center">
                  Transaction Complete
                </Text>
                <Text color="$gray11" ta="center">
                  Finishing up...
                </Text>
              </YStack>
            </Card>
          </YStack>
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
          <YStack width="100%" $gtSm={{ width: 600 }} gap="$4" testID="pending-payment">
            <Card bc="$color1" width="100%" p="$6">
              <YStack ai="center" gap="$4">
                <Spinner size="large" color="$primary" />
                <Text fontSize="$8" fontWeight="600" ta="center">
                  Processing Transaction
                </Text>
                <Text color="$gray11" ta="center">
                  Complete in Coinbase window
                </Text>
                <Button
                  theme="green"
                  px="$3.5"
                  h="$4.5"
                  borderRadius="$4"
                  f={1}
                  onPress={closeOnramp}
                >
                  <XStack w="100%" gap="$2.5" ai="center" jc="center">
                    <LinkableButton.Text
                      fontWeight="500"
                      tt="uppercase"
                      $theme-dark={{ col: '$color0' }}
                    >
                      Cancel
                    </LinkableButton.Text>
                  </XStack>
                </Button>
              </YStack>
            </Card>
          </YStack>
        )

      case status === 'failure':
        return (
          <YStack width="100%" $gtSm={{ width: 600 }} gap="$4" testID="failure">
            <Card bc="$color1" width="100%" p="$6">
              <YStack ai="center" gap="$4">
                <Text fontSize="$8" fontWeight="600" color="$red10" ta="center">
                  Transaction Timed Out
                </Text>
                <Text color="$gray11" ta="center">
                  Your payment took too long to process. Please try again.
                </Text>
                <Button
                  theme="green"
                  px="$3.5"
                  h="$4.5"
                  borderRadius="$4"
                  f={1}
                  onPress={closeOnramp}
                >
                  <XStack w="100%" gap="$2.5" ai="center" jc="center">
                    <LinkableButton.Text
                      fontWeight="500"
                      tt="uppercase"
                      $theme-dark={{ col: '$color0' }}
                    >
                      Try Again
                    </LinkableButton.Text>
                  </XStack>
                </Button>
              </YStack>
            </Card>
          </YStack>
        )

      case coinbaseStatus === 'failed':
        return (
          <YStack width="100%" $gtSm={{ width: 600 }} gap="$4" testID="coinbase-failure">
            <Card bc="$color1" width="100%" p="$6">
              <YStack ai="center" gap="$4">
                <Text fontSize="$8" fontWeight="600" color="$red10" ta="center">
                  Transaction Failed
                </Text>
                <Text color="$gray11" ta="center">
                  Your payment could not be processed. Please try again.
                </Text>
                <Button
                  theme="green"
                  px="$3.5"
                  h="$4.5"
                  borderRadius="$4"
                  f={1}
                  onPress={closeOnramp}
                >
                  <XStack w="100%" gap="$2.5" ai="center" jc="center">
                    <LinkableButton.Text
                      fontWeight="500"
                      tt="uppercase"
                      $theme-dark={{ col: '$color0' }}
                    >
                      Try Again
                    </LinkableButton.Text>
                  </XStack>
                </Button>
              </YStack>
            </Card>
          </YStack>
        )

      default:
        return <OnrampFlow onConfirmTransaction={handleConfirmTransaction} isLoading={isLoading} />
    }
  }

  return (
    <YStack mt="$4" mx="auto" width="100%">
      {renderContent()}
    </YStack>
  )
}
