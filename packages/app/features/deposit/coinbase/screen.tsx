import { OnrampFlow } from 'app/features/deposit/components/OnrampFlow'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { toNiceError } from 'app/utils/toNiceError'
import { YStack, Text, Button, Spinner } from '@my/ui'

const COINBASE_APP_ID = process.env.NEXT_PUBLIC_CDP_APP_ID ?? ''

interface DepositCoinbaseScreenProps {
  defaultPaymentMethod?: 'APPLE_PAY' | 'CARD'
}

export function DepositCoinbaseScreen({ defaultPaymentMethod }: DepositCoinbaseScreenProps) {
  const { data: sendAccount } = useSendAccount()
  const { openOnramp, closeOnramp, status, error, isLoading } = useCoinbaseOnramp({
    projectId: COINBASE_APP_ID,
    address: sendAccount?.address ?? '',
    partnerUserId: sendAccount?.user_id ?? '',
    defaultPaymentMethod,
  })

  const handleConfirmTransaction = (amount: number) => {
    openOnramp(amount)
  }

  const renderContent = () => {
    switch (true) {
      case !!error:
        return (
          <YStack ai="center" gap="$4" py="$8">
            <Text fontSize="$6" fontWeight="500" color="$red10" ta="center">
              Unable to Initialize Payment
            </Text>
            <Text color="$gray11" ta="center">
              {toNiceError(error)}
            </Text>
            <Button
              variant="outlined"
              color="$color"
              size="$4"
              hoverStyle={{
                backgroundColor: '$color1',
                borderColor: '$color8',
              }}
              pressStyle={{
                backgroundColor: '$color2',
              }}
              onPress={closeOnramp}
            >
              Try Again
            </Button>
          </YStack>
        )

      case status === 'success':
        return (
          <YStack ai="center" gap="$4" py="$8">
            <Spinner size="large" color="$primary" />
            <Text fontSize="$6" fontWeight="500" ta="center">
              Transaction Complete
            </Text>
            <Text color="$gray11" ta="center">
              Finishing up...
            </Text>
          </YStack>
        )

      case status === 'pending':
        return (
          <YStack ai="center" gap="$4" py="$8">
            <Spinner size="large" color="$primary" />
            <Text fontSize="$6" fontWeight="500" ta="center">
              Processing Transaction
            </Text>
            <Text color="$gray11" ta="center">
              Complete in Coinbase window
            </Text>
            <Button
              variant="outlined"
              color="$color"
              size="$4"
              hoverStyle={{
                backgroundColor: '$color1',
                borderColor: '$color8',
              }}
              pressStyle={{
                backgroundColor: '$color2',
              }}
              onPress={closeOnramp}
            >
              Cancel
            </Button>
          </YStack>
        )

      case status === 'failed':
        return (
          <YStack ai="center" gap="$4" py="$8">
            <Text fontSize="$6" fontWeight="500" color="$red10" ta="center">
              Transaction Failed
            </Text>
            <Text color="$gray11" ta="center">
              Your payment could not be processed. Please try again.
            </Text>
            <Button variant="outlined" color="$color" size="$4" onPress={closeOnramp}>
              Try Again
            </Button>
          </YStack>
        )

      default:
        return <OnrampFlow onConfirmTransaction={handleConfirmTransaction} isLoading={isLoading} />
    }
  }

  return (
    <YStack mt="$4" mx="auto" width={'100%'} $sm={{ maxWidth: 600 }}>
      <YStack w={'100%'}>
        <YStack f={1} px="$4" jc="space-between" pb="$4">
          {renderContent()}
        </YStack>
      </YStack>
    </YStack>
  )
}
