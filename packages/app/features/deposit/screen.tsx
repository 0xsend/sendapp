import { Button, Text, XStack, YStack } from '@my/ui'
import { Check } from '@tamagui/lucide-icons'
import { useState, useEffect } from 'react'
import { DepositAddress } from './components/DepositAddress'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { OnrampFlow } from './components/OnrampFlow'
import { Spinner } from '@my/ui'
import { LinkableButton } from '@my/ui'
import { toNiceError } from 'app/utils/toNiceError'
import { DepositOptionButton } from './components/DepositOptionButton'

const COINBASE_APP_ID = process.env.NEXT_PUBLIC_CDP_APP_ID ?? ''
// const ONRAMP_ENABLED_USERS = (process.env.NEXT_PUBLIC_ONRAMP_ALLOWLIST ?? '').split(',')

export function DepositScreen() {
  const [selectedOption, setSelectedOption] = useState<'crypto' | 'card' | null>(null)
  const [showAddress, setShowAddress] = useState(false)
  const [showAmountFlow, setShowAmountFlow] = useState(false)

  const { data: sendAccount } = useSendAccount()
  const isOnrampEnabled = true
  // const isOnrampEnabled = sendAccount?.user_id && ONRAMP_ENABLED_USERS.includes(sendAccount.user_id)
  const { openOnramp, closeOnramp, status, error, isLoading } = useCoinbaseOnramp({
    projectId: COINBASE_APP_ID,
    address: sendAccount?.address ?? '',
  })
  console.log('Hook returned status:', status)

  useEffect(() => {
    if (status === 'idle') {
      setSelectedOption(null)
      setShowAddress(false)
      setShowAmountFlow(false)
    }
  }, [status])

  const handleOptionSelect = (option: 'crypto' | 'card') => {
    setSelectedOption(option)
    if (!sendAccount?.address) return

    if (option === 'crypto') {
      setShowAddress(true)
    } else {
      setShowAmountFlow(true)
    }
  }

  const handleConfirmTransaction = (amount: number) => {
    openOnramp(amount)
  }

  const renderContent = () => {
    console.log('Current status:', status)
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
            <Button backgroundColor="$primary" color="$color" size="$4" onPress={closeOnramp}>
              Try Again
            </Button>
          </YStack>
        )

      case status === 'pending':
        console.log('Rendering pending state')
        return (
          <YStack ai="center" gap="$4" py="$8">
            <Spinner size="large" color="$primary" />
            <Text fontSize="$6" fontWeight="500" ta="center">
              Complete Your Transaction
            </Text>
            <Text color="$gray11" ta="center">
              Please complete your transaction in the Coinbase window.
            </Text>
            <Button variant="outlined" color="$color" size="$4" onPress={closeOnramp}>
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
            <Button backgroundColor="$primary" color="$color" size="$4" onPress={closeOnramp}>
              Try Again
            </Button>
          </YStack>
        )

      case showAmountFlow:
        return <OnrampFlow onConfirmTransaction={handleConfirmTransaction} isLoading={isLoading} />

      case showAddress:
        return (
          <YStack width="100%" ai="center">
            <DepositAddress address={sendAccount?.address} />
          </YStack>
        )

      default:
        return (
          <YStack gap="$3" width="100%">
            <DepositOptionButton
              option="crypto"
              selectedOption={selectedOption}
              onPress={() => handleOptionSelect('crypto')}
              title="Via Crypto"
              description="Direct deposit via External Wallet"
            />

            {isOnrampEnabled && (
              <DepositOptionButton
                option="card"
                selectedOption={selectedOption}
                onPress={() => handleOptionSelect('card')}
                title="Debit Card"
                description="Up to $500 per week"
              />
            )}
          </YStack>
        )
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
