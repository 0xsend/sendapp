import { Button, Text, XStack, YStack } from '@my/ui'
import { Wallet } from '@tamagui/lucide-icons'
import { Banknote } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { DepositAddress } from 'app/components/DepositAddress'
import { useSendAccount } from 'app/utils/send-accounts'

export function DepositScreen() {
  const [selectedOption, setSelectedOption] = useState<'crypto' | 'apple' | null>(null)
  const [showAddress, setShowAddress] = useState(false)
  const { data: sendAccount } = useSendAccount()

  return (
    <YStack mt="$4" mx="auto" width={'100%'} $sm={{ maxWidth: 600 }}>
      <YStack w={'100%'}>
        <YStack f={1} px="$4" jc="space-between" pb="$4">
          <YStack gap="$3" width="100%">
            {!showAddress ? (
              <>
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
                          Upto $500 Week
                        </Text>
                      </YStack>
                    </XStack>
                  </XStack>
                </Button>
              </>
            ) : (
              <YStack width="100%" ai="center">
                <DepositAddress address={sendAccount?.address} />
              </YStack>
            )}
          </YStack>

          {!showAddress && (
            <Button
              backgroundColor="$primary"
              color="$color"
              size="$5"
              mt="$6"
              disabled={!selectedOption}
              opacity={selectedOption ? 1 : 0.5}
              onPress={() => {
                if (selectedOption === 'crypto') {
                  setShowAddress(true)
                }
              }}
            >
              CONTINUE
            </Button>
          )}
        </YStack>
      </YStack>
    </YStack>
  )
}
