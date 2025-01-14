import { Button, Text, XStack, YStack, Dialog } from '@my/ui'
import { Wallet, Banknote } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { DepositAddress } from 'app/components/DepositAddress'
import { DepositAmountSelector } from 'app/components/DepositAmountSelector'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { OnrampPreview, type QuoteResponse } from 'app/components/OnrampPreview'

export function DepositScreen() {
  const [selectedOption, setSelectedOption] = useState<'crypto' | 'apple' | null>(null)
  const [showAddress, setShowAddress] = useState(false)
  const [showAmountSelector, setShowAmountSelector] = useState(false)
  const { data: sendAccount } = useSendAccount()
  const { openOnramp, isLoading, getQuote } = useCoinbaseOnramp()
  const [showPreview, setShowPreview] = useState(false)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)

  const handleContinue = async () => {
    if (selectedOption === 'crypto') {
      setShowAddress(true)
    } else if (selectedOption === 'apple') {
      setShowAmountSelector(true)
    }
  }

  const handleAmountConfirm = async (amount: number) => {
    if (!sendAccount?.address) return

    try {
      const quoteData = await getQuote.mutateAsync({
        purchase_currency: 'USDC',
        payment_amount: amount.toFixed(2),
        payment_currency: 'USD',
        payment_method: 'CARD',
        country: 'US',
      })
      setQuote(quoteData)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to get quote:', error)
    }
  }

  const handleConfirm = async () => {
    if (!sendAccount?.address || !quote) return

    try {
      const amount = Number.parseFloat(quote.payment_total.value)
      if (Number.isNaN(amount)) throw new Error('Invalid amount')

      await openOnramp(sendAccount.address, {
        quoteId: quote.quote_id,
        defaultAsset: 'USDC',
        defaultPaymentMethod: 'CARD',
        fiatCurrency: 'USD',
        presetFiatAmount: amount,
      })
      setShowPreview(false)
    } catch (error) {
      console.error('Failed to open onramp:', error)
    }
  }

  return (
    <YStack mt="$4" mx="auto" width={'100%'} $sm={{ maxWidth: 600 }}>
      <YStack w={'100%'}>
        <YStack f={1} px="$4" jc="space-between" pb="$4">
          <YStack gap="$3" width="100%">
            {!showAddress && !showAmountSelector ? (
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
                          Up to $500 per week
                        </Text>
                      </YStack>
                    </XStack>
                  </XStack>
                </Button>
              </>
            ) : showAddress ? (
              <YStack width="100%" ai="center">
                <DepositAddress address={sendAccount?.address} />
              </YStack>
            ) : showAmountSelector ? (
              <DepositAmountSelector onConfirm={handleAmountConfirm} />
            ) : null}
          </YStack>

          {!showAddress && !showAmountSelector && (
            <Button
              backgroundColor="$primary"
              color="$color"
              size="$5"
              mt="$6"
              disabled={!selectedOption || isLoading}
              opacity={selectedOption && !isLoading ? 1 : 0.5}
              onPress={handleContinue}
            >
              {isLoading ? 'LOADING...' : 'CONTINUE'}
            </Button>
          )}
        </YStack>
      </YStack>

      <Dialog modal open={showPreview} onOpenChange={setShowPreview}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Transaction Summary</Dialog.Title>

            <OnrampPreview
              address={sendAccount?.address ?? ''}
              quote={quote}
              isLoading={isLoading}
            />

            <XStack gap="$3" jc="flex-end" mt="$4">
              <Dialog.Close asChild>
                <Button variant="outlined" color="$color">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                backgroundColor="$primary"
                color="$color"
                onPress={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Proceed'}
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </YStack>
  )
}
