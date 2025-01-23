import { Button, Text, XStack, YStack } from '@my/ui'
import { Wallet, Banknote, Check } from '@tamagui/lucide-icons'
import { useState, useEffect } from 'react'
import { DepositAddress } from 'app/components/DepositAddress'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'

const COINBASE_APP_ID = process.env.NEXT_PUBLIC_CDP_APP_ID ?? ''

export function DepositScreen() {
  const [selectedOption, setSelectedOption] = useState<'crypto' | 'apple' | null>(null)
  const [showAddress, setShowAddress] = useState(false)

  const { data: sendAccount } = useSendAccount()
  const { openOnramp, status, isLoading, error, closeOnramp } = useCoinbaseOnramp(
    COINBASE_APP_ID,
    sendAccount?.address ?? ''
  )

  // Reset UI states when the onramp status changes
  useEffect(() => {
    if (status === 'idle') {
      setSelectedOption(null)
      setShowAddress(false)
    }
  }, [status])

  const handleContinue = () => {
    if (!sendAccount?.address) return

    if (selectedOption === 'crypto') {
      setShowAddress(true)
    } else if (selectedOption === 'apple') {
      openOnramp()
    }
  }

  const handleCancel = () => {
    closeOnramp()
  }

  const renderContent = () => {
    if (error) {
      return (
        <YStack ai="center" gap="$4" py="$8">
          <Text fontSize="$6" fontWeight="500" color="$red10" ta="center">
            Unable to Initialize Payment
          </Text>
          <Text color="$gray11" ta="center">
            {error.message}
          </Text>
          <Button backgroundColor="$primary" color="$color" size="$4" onPress={handleCancel}>
            Try Again
          </Button>
        </YStack>
      )
    }

    if (status === 'success') {
      return (
        <YStack ai="center" gap="$4" py="$8">
          <Check size={48} color="#16a34a" />
          <Text fontSize="$6" fontWeight="500" ta="center">
            Deposit Successful
          </Text>
          <Text color="$gray11" ta="center">
            Your funds are on the way. They will appear in your wallet shortly.
          </Text>
          <Button backgroundColor="$primary" color="$color" size="$4" onPress={handleCancel}>
            Make Another Deposit
          </Button>
        </YStack>
      )
    }

    if (status === 'pending') {
      return (
        <YStack ai="center" gap="$4" py="$8">
          <Text fontSize="$6" fontWeight="500" ta="center">
            Complete Your Transaction
          </Text>
          <Text color="$gray11" ta="center">
            Please complete your transaction in the Coinbase window.
          </Text>
          <Button variant="outlined" color="$color" size="$4" onPress={handleCancel}>
            Cancel
          </Button>
        </YStack>
      )
    }

    if (showAddress) {
      return (
        <YStack width="100%" ai="center">
          <DepositAddress address={sendAccount?.address} />
        </YStack>
      )
    }

    return (
      <YStack gap="$3" width="100%">
        <Button
          height={80}
          borderRadius="$4"
          backgroundColor={selectedOption === 'crypto' ? '$backgroundHover' : '$background'}
          position="relative"
          borderWidth={selectedOption === 'crypto' ? 1 : 0}
          borderColor="$primary"
          onPress={() => setSelectedOption('crypto')}
        >
          <YStack
            position="absolute"
            left={0}
            top="50%"
            height={40}
            transform={[{ translateY: -20 }]}
            width={4}
            backgroundColor="$primary"
          />
          <XStack ai="center" jc="space-between" width="100%" px="$4">
            <XStack ai="center" gap="$3">
              <Wallet size={24} color={selectedOption === 'crypto' ? '#16a34a' : '#888'} />
              <YStack>
                <Text fontWeight="500">Via Crypto</Text>
                <Text color="$gray10" fontSize="$3">
                  Direct deposit via External Wallet
                </Text>
              </YStack>
            </XStack>
          </XStack>
        </Button>

        <Button
          height={80}
          borderRadius="$4"
          backgroundColor={selectedOption === 'apple' ? '$backgroundHover' : '$background'}
          position="relative"
          borderWidth={selectedOption === 'apple' ? 1 : 0}
          borderColor="$primary"
          onPress={() => setSelectedOption('apple')}
        >
          <YStack
            position="absolute"
            left={0}
            top="50%"
            height={40}
            transform={[{ translateY: -20 }]}
            width={4}
            backgroundColor="$primary"
          />
          <XStack ai="center" jc="space-between" width="100%" px="$4">
            <XStack ai="center" gap="$3">
              <Banknote size={24} color={selectedOption === 'apple' ? '#16a34a' : '#888'} />
              <YStack>
                <Text fontWeight="500">Apple Pay</Text>
                <Text color="$gray10" fontSize="$3">
                  Up to $500 per week
                </Text>
              </YStack>
            </XStack>
          </XStack>
        </Button>

        <Button
          backgroundColor="$primary"
          color="$color"
          size="$5"
          mt="$3"
          disabled={!selectedOption || isLoading}
          opacity={selectedOption && !isLoading ? 1 : 0.5}
          onPress={handleContinue}
        >
          {isLoading ? 'LOADING...' : 'CONTINUE'}
        </Button>
      </YStack>
    )
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
