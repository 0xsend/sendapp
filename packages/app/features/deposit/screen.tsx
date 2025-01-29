import { Button, Text, XStack, YStack } from '@my/ui'
import { Wallet, Banknote, Check } from '@tamagui/lucide-icons'
import { useState, useEffect } from 'react'
import { DepositAddress } from './components/DepositAddress'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { OnrampFlow } from './components/OnrampFlow'
import { Spinner } from '@my/ui'
import { LinkableButton } from '@my/ui'

const COINBASE_APP_ID = process.env.NEXT_PUBLIC_CDP_APP_ID ?? ''
// const ONRAMP_ENABLED_USERS = (process.env.NEXT_PUBLIC_ONRAMP_ALLOWLIST ?? '').split(',')

export function DepositScreen() {
  const [selectedOption, setSelectedOption] = useState<'crypto' | 'card' | 'apple' | null>(null)
  const [showAddress, setShowAddress] = useState(false)
  const [showAmountFlow, setShowAmountFlow] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(0)

  const { data: sendAccount } = useSendAccount()
  const isOnrampEnabled = true
  // const isOnrampEnabled = sendAccount?.user_id && ONRAMP_ENABLED_USERS.includes(sendAccount.user_id)
  const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
  const { openOnramp, status, error, isLoading, closeOnramp } = useCoinbaseOnramp(
    COINBASE_APP_ID,
    sendAccount?.address ?? '',
    selectedAmount
  )
  console.log('Hook returned status:', status)

  useEffect(() => {
    if (status === 'idle') {
      setSelectedOption(null)
      setShowAddress(false)
      setShowAmountFlow(false)
    }
  }, [status])

  const handleContinue = () => {
    if (!sendAccount?.address) return

    if (selectedOption === 'crypto') {
      setShowAddress(true)
    } else if (selectedOption === 'card' || selectedOption === 'apple') {
      setShowAmountFlow(true)
    }
  }

  const handleConfirmTransaction = (amount: number) => {
    setSelectedAmount(amount)
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
              {error.message}
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

      case status === 'success':
        return (
          <YStack ai="center" gap="$4" py="$8">
            <Check size={48} color="#16a34a" />
            <Text fontSize="$6" fontWeight="500" ta="center">
              Deposit Successful
            </Text>
            <Text color="$gray11" ta="center">
              Your funds are on the way. They will appear in your wallet shortly.
            </Text>
            <Button theme="green" px="$3.5" h="$4.5" borderRadius="$4" f={1} onPress={closeOnramp}>
              <XStack w="100%" gap="$2.5" ai="center" jc="center">
                <LinkableButton.Text
                  fontWeight="500"
                  tt="uppercase"
                  $theme-dark={{ col: '$color0' }}
                >
                  MAKE ANOTHER DEPOSIT
                </LinkableButton.Text>
              </XStack>
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

            {isOnrampEnabled && (
              <>
                <Button
                  height={80}
                  borderRadius="$4"
                  backgroundColor={selectedOption === 'card' ? '$backgroundHover' : '$background'}
                  position="relative"
                  borderWidth={selectedOption === 'card' ? 1 : 0}
                  borderColor="$primary"
                  onPress={() => setSelectedOption('card')}
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
                      <Banknote size={24} color={selectedOption === 'card' ? '#16a34a' : '#888'} />
                      <YStack>
                        <Text fontWeight="500">Via Card</Text>
                        <Text color="$gray10" fontSize="$3">
                          Up to $500 per week
                        </Text>
                      </YStack>
                    </XStack>
                  </XStack>
                </Button>

                {isIOS && (
                  <Button
                    height={80}
                    borderRadius="$4"
                    backgroundColor={
                      selectedOption === 'apple' ? '$backgroundHover' : '$background'
                    }
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
                        <Banknote
                          size={24}
                          color={selectedOption === 'apple' ? '#16a34a' : '#888'}
                        />
                        <YStack>
                          <Text fontWeight="500">Apple Pay</Text>
                          <Text color="$gray10" fontSize="$3">
                            Up to $500 per week
                          </Text>
                        </YStack>
                      </XStack>
                    </XStack>
                  </Button>
                )}
              </>
            )}

            <Button
              theme="green"
              px="$3.5"
              h="$4.5"
              borderRadius="$4"
              f={1}
              disabled={!selectedOption || isLoading}
              opacity={selectedOption && !isLoading ? 1 : 0.5}
              onPress={handleContinue}
            >
              <XStack w="100%" gap="$2.5" ai="center" jc="center">
                <LinkableButton.Text
                  fontWeight="500"
                  tt="uppercase"
                  $theme-dark={{ col: '$color0' }}
                >
                  {isLoading ? 'LOADING...' : 'CONTINUE'}
                </LinkableButton.Text>
              </XStack>
            </Button>
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
