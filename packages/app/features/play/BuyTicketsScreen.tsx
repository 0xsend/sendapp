import {
  Paragraph,
  XStack,
  YStack,
  H4,
  Spinner,
  Card,
  H3,
  Input,
  Button,
  useSafeAreaInsets,
  useToastController,
} from '@my/ui'
import { assert } from 'app/utils/assert'
import { useState, useMemo } from 'react'
import { useRouter } from 'solito/router'
import { Timer } from '@tamagui/lucide-icons'
import { usePurchaseJackpotTicket } from './usePurchaseJackpotTicketMutation'
import {
  useReadBaseJackpotTicketPrice,
  useReadBaseJackpotToken,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'
import { formatUnits } from 'viem'
import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { useSendAccount } from 'app/utils/send-accounts'
import { useAccountNonce } from 'app/utils/userop'
import { useSendUserOpMutation } from 'app/utils/sendUserOp'
import { useCoins } from 'app/provider/coins'
import formatAmount from 'app/utils/formatAmount'
import type { Address } from 'viem'

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
  const {
    data: fetchedNonce,
    isLoading: isLoadingNonce,
    error: nonceError,
  } = useAccountNonce({
    sender: senderAddress,
  })

  // --- Get SEND Balance (keep for display) ---
  const { coins, isLoading: isLoadingBalance } = useCoins()
  const sendCoin = useMemo(
    () => coins.find((coin) => coin.symbol === 'SEND'),
    [coins] // Assuming tokenAddress corresponds to SEND for now
  )

  // --- Calculations ---
  const ticketPriceBigInt = useMemo(() => contractTicketPrice ?? 0n, [contractTicketPrice])
  const numTickets = useMemo(() => {
    const parsed = Number.parseInt(ticketCount || '0', 10)
    return Number.isNaN(parsed) ? 0n : BigInt(parsed)
  }, [ticketCount])
  const totalCostBigInt = useMemo(() => {
    if (typeof numTickets === 'bigint' && typeof ticketPriceBigInt === 'bigint') {
      return numTickets * ticketPriceBigInt
    }
    return 0n
  }, [numTickets, ticketPriceBigInt])

  // Format user balance
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
    if (typeof ticketPriceBigInt !== 'bigint' || tokenDecimals === undefined) return '...'
    return formatUnits(ticketPriceBigInt, Number(tokenDecimals))
  }, [ticketPriceBigInt, tokenDecimals])

  const displayTotalCost = useMemo(() => {
    if (typeof totalCostBigInt !== 'bigint' || tokenDecimals === undefined) return '...'
    return formatUnits(totalCostBigInt, Number(tokenDecimals))
  }, [totalCostBigInt, tokenDecimals])

  // --- Prepare Purchase Data ---
  const {
    userOp: preparedUserOp, // Rename to avoid conflict later
    usdcFees,
    isLoading: isLoadingPreparation,
    error: preparationError,
  } = usePurchaseJackpotTicket({
    tokenAddress: tokenAddress as Address,
    ticketPrice: ticketPriceBigInt as bigint, // Explicit cast to satisfy TS
    recipient: senderAddress as Address,
    // Referrer can be added if needed: referrer: '0x...'
  })

  const sendUserOpMutation = useSendUserOpMutation()

  // --- Combined Loading State ---
  const isLoading =
    isLoadingPrice ||
    isLoadingToken ||
    isLoadingDecimals ||
    isLoadingUser ||
    isLoadingNonce ||
    isLoadingBalance ||
    isLoadingPreparation ||
    sendUserOpMutation.isPending

  // --- Mutation Handler ---
  const handleBuyTickets = async () => {
    // --- Perform all checks upfront ---
    if (isLoading) {
      console.log('Purchase attempt blocked: Already loading')
      return // Prevent multiple clicks
    }

    const webauthnCreds =
      sendAccount?.send_account_credentials
        .filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

    try {
      // Use assert for preconditions
      assert(!nonceError, 'Nonce failed to generate')
      assert(!preparationError, 'Userop failed to generate')
      assert(!insufficientFunds, 'Insufficient funds.')
      assert(numTickets > 0n, 'Please enter a valid number of tickets.')
      assert(!!senderAddress, 'User account address not found.')
      assert(fetchedNonce !== undefined, 'Could not determine account nonce.')
      assert(webauthnCreds.length > 0, 'WebAuthn credentials not found.')
      assert(
        typeof ticketPriceBigInt === 'bigint' && ticketPriceBigInt > 0n,
        'Invalid or zero ticket price.'
      )
      // Use assert for preconditions
      assert(!!preparedUserOp, 'Transaction details could not be prepared.')

      // Final UserOp to be signed and sent
      const finalUserOp = {
        ...preparedUserOp,
        nonce: fetchedNonce, // Ensure the latest nonce is used
        // Note: Signature will be added by useSendUserOpMutation internally
      }

      toast.show('Processing...', { message: 'Submitting transaction...' })
      await sendUserOpMutation.mutateAsync({
        userOp: finalUserOp,
        // Pass credentials for signing using the correct property name 'webauthnCreds'
        webauthnCreds: webauthnCreds,
      })
      toast.show('Success', { message: `Successfully purchased ${ticketCount} tickets!` })
      router.push('/play')
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
                      {isLoadingBalance ? (
                        <Spinner size="small" />
                      ) : (
                        <Paragraph
                          color={insufficientFunds ? '$error' : '$color12'}
                          size={'$5'}
                          fontWeight={'600'}
                        >
                          {sendCoin && tokenDecimals !== undefined
                            ? formatAmount(
                                formatUnits(userBalanceBigInt, Number(tokenDecimals)), // Use calculated balance and decimals
                                10,
                                sendCoin.formatDecimals ?? 5
                              )
                            : '0'}{' '}
                          SEND
                        </Paragraph>
                      )}
                    </XStack>
                    {insufficientFunds && !isLoadingBalance && (
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

              {/* Display Estimated Fee */}
              <XStack jc="space-between" ai="center" mt="$2">
                <Paragraph fontSize="$5" fontWeight="500" color="$color10">
                  Estimated Fee:
                </Paragraph>
                <H4 color="$color10">
                  {isLoadingPreparation ? (
                    <Spinner size="small" />
                  ) : usdcFees !== undefined ? (
                    `~${formatAmount(
                      formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals)
                    )} USDC` // Assuming 6 decimals for USDC
                  ) : (
                    '...' // Or handle error state if preparationError exists
                  )}
                </H4>
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
              disabled={isLoading || insufficientFunds || numTickets <= 0n}
              disabledStyle={{ opacity: 0.5 }}
              {...(sendUserOpMutation.isPending && { icon: <Spinner /> })}
            >
              <Button.Text fontWeight="600">
                {sendUserOpMutation.isPending ? 'Purchasing...' : 'Buy Tickets'}
              </Button.Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </HomeLayout>
  )
}
