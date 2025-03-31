import {
  Paragraph,
  XStack,
  YStack,
  Spinner,
  Card,
  H3,
  Input,
  Button,
  useSafeAreaInsets,
  useToastController, // Added for notifications
} from '@my/ui'
import { useState, useMemo } from 'react' // Added useMemo
import { useRouter } from 'solito/router'
import { Timer } from '@tamagui/lucide-icons'
import { usePurchaseJackpotTicketMutation } from './usePurchaseJackpotTicketMutation' // Import the mutation hook
import {
  useReadBaseJackpotTicketPrice,
  useReadBaseJackpotToken,
  useReadBaseJackpotTokenDecimals, // Need decimals for parsing
} from '@my/wagmi/contracts/base-jackpot' // Import read hooks
import { formatUnits as formatUnitsViem } from 'viem' // Import parseUnits, rename formatUnits, add isAddress
import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { useSendAccount } from 'app/utils/send-accounts' // Import the hook
import { useAccountNonce } from 'app/utils/userop' // Import the nonce hook
import { useCoins } from 'app/provider/coins' // Keep for balance display for now
import formatAmount from 'app/utils/formatAmount'
import type { Address } from 'viem' // Re-add Address type import if needed, or ensure it's imported elsewhere

export function BuyTicketsScreen() {
  const router = useRouter()
  const toast = useToastController()
  const { bottom } = useSafeAreaInsets()
  const [ticketCount, setTicketCount] = useState('1')
  const [isInputFocused, setIsInputFocused] = useState(false)

  // --- Fetch Contract Data ---
  const { data: contractTicketPrice, isLoading: isLoadingPrice } = useReadBaseJackpotTicketPrice()
  const { data: tokenAddress, isLoading: isLoadingToken } = useReadBaseJackpotToken()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  // --- Fetch User Account Data ---
  const { data: sendAccount, isLoading: isLoadingUser } = useSendAccount()
  const senderAddress = sendAccount?.address
  // Fetch nonce using the dedicated hook
  const {
    data: fetchedNonce,
    isLoading: isLoadingNonce,
    error: nonceError,
  } = useAccountNonce({
    sender: senderAddress,
  })
  const webauthnCreds = sendAccount?.send_account_credentials ?? [] // Assuming credentials are here

  // --- Get SEND Balance (keep for display) ---
  const { coins, isLoading: isLoadingBalance } = useCoins() // Renamed original isLoading
  const sendCoin = useMemo(
    () => coins.find((coin) => coin.symbol === 'SEND'),
    [coins] // Assuming tokenAddress corresponds to SEND for now
  )

  // --- Calculations ---
  const ticketPriceBigInt = useMemo(() => contractTicketPrice ?? 0n, [contractTicketPrice])
  const numTickets = useMemo(() => {
    const parsed = Number.parseInt(ticketCount || '0', 10)
    return Number.isNaN(parsed) ? 0n : BigInt(parsed) // Use Number.isNaN and ensure valid bigint
  }, [ticketCount])
  const totalCostBigInt = useMemo(() => {
    // Explicitly check types before multiplication
    if (typeof numTickets === 'bigint' && typeof ticketPriceBigInt === 'bigint') {
      return numTickets * ticketPriceBigInt
    }
    return 0n // Default to 0n if types are not bigint
  }, [numTickets, ticketPriceBigInt])

  // Format user balance (BigInt)
  const userBalanceBigInt = useMemo(() => {
    if (!sendCoin?.balance) return 0n
    try {
      // Assuming sendCoin.balance is already a bigint or string representing it
      return BigInt(sendCoin.balance)
    } catch {
      return 0n
    }
  }, [sendCoin])

  const insufficientFunds = useMemo(
    () => totalCostBigInt > userBalanceBigInt,
    [totalCostBigInt, userBalanceBigInt]
  )

  // Format display values
  const displayTicketPrice = useMemo(() => {
    // Check type explicitly
    if (typeof ticketPriceBigInt !== 'bigint' || tokenDecimals === undefined) return '...'
    // Use formatUnitsViem here
    return formatUnitsViem(ticketPriceBigInt, Number(tokenDecimals))
  }, [ticketPriceBigInt, tokenDecimals])

  const displayTotalCost = useMemo(() => {
    // Check type explicitly
    if (typeof totalCostBigInt !== 'bigint' || tokenDecimals === undefined) return '...'
    // Use formatUnitsViem here
    return formatUnitsViem(totalCostBigInt, Number(tokenDecimals))
  }, [totalCostBigInt, tokenDecimals])

  // --- Combined Loading State ---
  const purchaseMutation = usePurchaseJackpotTicketMutation() // Initialize mutation hook earlier
  const isLoading =
    isLoadingPrice ||
    isLoadingToken ||
    isLoadingDecimals ||
    isLoadingUser ||
    isLoadingNonce || // Add nonce loading state
    isLoadingBalance ||
    purchaseMutation.isPending // Combine all loading states

  // --- Get next draw date (keep existing logic) ---
  // Removed old userBalance and insufficientFunds calculations here
  const getNextDrawDate = () => {
    const now = new Date()
    const nextDraw = new Date(now)
    nextDraw.setHours(20, 0, 0, 0)

    if (now > nextDraw) {
      nextDraw.setDate(nextDraw.getDate() + 1)
    }

    return nextDraw.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // --- Mutation Handler ---
  const handleBuyTickets = async () => {
    // --- Perform all checks upfront ---
    if (isLoading) {
      console.log('Purchase attempt blocked: Already loading')
      return // Prevent multiple clicks
    }
    if (insufficientFunds) {
      toast.show('Error', { message: 'Insufficient funds.' })
      return
    }
    if (numTickets <= 0n) {
      toast.show('Error', { message: 'Please enter a valid number of tickets.' })
      return
    }
    if (!senderAddress) {
      toast.show('Error', { message: 'User account address not found.' })
      return
    }
    // Check for nonce error first
    if (nonceError) {
      console.error('Nonce fetch error:', nonceError)
      toast.show('Error', { message: 'Could not fetch account nonce. Please try again.' })
      return
    }
    // Now check if fetchedNonce is defined
    if (fetchedNonce === undefined) {
      toast.show('Error', { message: 'Could not determine account nonce.' })
      return
    }
    if (webauthnCreds.length === 0) {
      toast.show('Error', { message: 'WebAuthn credentials not found.' })
      return
    }
    // Ensure ticketPriceBigInt is valid (should be > 0n if contract loaded)
    if (typeof ticketPriceBigInt !== 'bigint' || ticketPriceBigInt <= 0n) {
      toast.show('Error', { message: 'Invalid or zero ticket price.' })
      return
    }

    try {
      toast.show('Processing...', { message: 'Submitting transaction...' })
      await purchaseMutation.mutateAsync({
        sender: senderAddress,
        tokenAddress: tokenAddress as Address,
        ticketPrice: ticketPriceBigInt, // No assertion needed
        recipient: senderAddress, // User buys tickets for themselves
        nonce: fetchedNonce, // Use the fetched nonce
        webauthnCreds: webauthnCreds
          .map((cred) => ({
            // Map from the nested structure provided by useSendAccount query
            raw_credential_id: cred.webauthn_credentials?.raw_credential_id,
            name: cred.webauthn_credentials?.name,
          }))
          .filter(
            (cred): cred is { raw_credential_id: `\\x${string}`; name: string } =>
              // Filter out any credentials where mapping failed or values are missing
              !!cred.raw_credential_id && !!cred.name
          ),
        // Optional: Add referrer logic if needed
      })
      toast.show('Success', { message: `Successfully purchased ${ticketCount} tickets!` })
      router.push('/play') // Navigate back on success
    } catch (error: unknown) {
      // Use unknown for type safety
      console.error('Failed to purchase tickets:', error)
      let errorMessage = 'Could not purchase tickets.'
      // Safely check if error is an object and has message properties
      if (typeof error === 'object' && error !== null) {
        errorMessage =
          (error as { shortMessage?: string }).shortMessage ||
          (error as { message?: string }).message ||
          errorMessage
      }
      toast.show('Purchase Failed', { message: errorMessage })
    }
  }

  const handleCancel = () => {
    router.push('/play')
  }

  return (
    <HomeLayout TopNav={<TopNav header="Buy Send Tickets" showLogo={true} />}>
      <YStack f={1} pb={Math.max(bottom, 24) + 16}>
        <YStack
          px="$4"
          py="$6"
          gap="$6"
          ai="center"
          $gtMd={{
            px: '$6',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Card w="100%" p="$5">
            <YStack gap="$5">
              <YStack gap="$2" ai="center">
                <Paragraph fontSize="$6" ta="center">
                  Each ticket costs {isLoading ? <Spinner size="small" /> : displayTicketPrice}{' '}
                  SEND. How many tickets would you like to purchase?
                </Paragraph>
                <XStack ai="center" gap="$2">
                  <Timer size="$1" color="$color10" />
                  <Paragraph fontSize="$4" color="$color10" ta="center">
                    Next draw: {getNextDrawDate()} (daily at 8:00 PM)
                  </Paragraph>
                </XStack>
              </YStack>

              <YStack
                gap="$5"
                bg={'$color1'}
                br={'$6'}
                p={'$5'}
                borderColor={insufficientFunds ? '$error' : 'transparent'}
                bw={1}
              >
                <XStack ai={'center'} position="relative" jc={'space-between'}>
                  <Input
                    fontSize="$10"
                    color="$color12"
                    fontWeight="500"
                    bw={0}
                    br={0}
                    p={1}
                    focusStyle={{
                      outlineWidth: 0,
                    }}
                    placeholder="1"
                    fontFamily="$mono"
                    inputMode="numeric"
                    value={ticketCount}
                    // Basic validation: allow only numbers, prevent leading zeros unless it's just "0"
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '')
                      setTicketCount(
                        numericValue.length > 1 && numericValue.startsWith('0')
                          ? numericValue.substring(1)
                          : numericValue || '0' // Ensure it's not empty, default to '0'
                      )
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    autoFocus
                  />
                  <Paragraph fontSize="$6" fontWeight="500" color="$color10">
                    Tickets
                  </Paragraph>
                  <XStack
                    position="absolute"
                    bottom={-8}
                    left={0}
                    right={0}
                    height={1}
                    backgroundColor={isInputFocused ? '$primary' : '$silverChalice'}
                    $theme-light={{
                      backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                    }}
                  />
                </XStack>

                <XStack jc="space-between" ai={'flex-start'}>
                  <YStack>
                    <XStack gap={'$2'} ai="center">
                      <Paragraph
                        color={insufficientFunds ? '$error' : '$silverChalice'}
                        size={'$5'}
                        $theme-light={{
                          color: insufficientFunds ? '$error' : '$darkGrayTextField',
                        }}
                      >
                        Balance:
                      </Paragraph>
                      {isLoadingBalance ? ( // Use specific loading flag for balance
                        <Spinner size="small" />
                      ) : (
                        <Paragraph
                          color={insufficientFunds ? '$error' : '$color12'}
                          size={'$5'}
                          fontWeight={'600'}
                        >
                          {sendCoin
                            ? formatAmount(
                                // TODO: Use userBalanceBigInt and tokenDecimals for formatting
                                (Number(sendCoin.balance) / 10 ** sendCoin.decimals).toString(),
                                10,
                                sendCoin.formatDecimals ?? 5
                              )
                            : '0'}{' '}
                          SEND
                        </Paragraph>
                      )}
                    </XStack>
                    {insufficientFunds &&
                      !isLoadingBalance && ( // Check specific loading flag
                        <Paragraph color={'$error'} size={'$5'}>
                          Insufficient funds
                        </Paragraph>
                      )}
                  </YStack>
                </XStack>
              </YStack>

              <XStack jc="space-between" ai="center">
                <Paragraph fontSize="$6" fontWeight="500">
                  Total Cost:
                </Paragraph>
                <H3 color="$color12">
                  {isLoading ? <Spinner size="small" /> : displayTotalCost} SEND
                </H3>
              </XStack>
            </YStack>
          </Card>

          <XStack gap="$4" w="100%" mt="$4">
            <Button theme="alt1" onPress={handleCancel} br="$4" px="$4" py="$4" f={1}>
              <Button.Text>Cancel</Button.Text>
            </Button>
            <Button
              theme="green"
              onPress={handleBuyTickets}
              br="$4"
              px="$4"
              py="$4"
              f={2}
              disabled={isLoading || insufficientFunds || numTickets <= 0n} // Use combined isLoading and bigint checks
              disabledStyle={{ opacity: 0.5 }}
              // Add icon for loading state
              {...(purchaseMutation.isPending && { icon: <Spinner /> })}
            >
              <Button.Text fontWeight="600">
                {purchaseMutation.isPending ? 'Purchasing...' : 'Buy Tickets'}
              </Button.Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </HomeLayout>
  )
}
