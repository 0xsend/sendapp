import {
  Button,
  Paragraph,
  Spinner,
  XStack,
  YStack,
  Separator,
  Card, // Using Card for consistency
  Text,
  useToastController, // Import the toast controller hook
} from '@my/ui'
import { createParam } from 'solito'
import { useLink } from 'solito/link'
import { useRouter } from 'solito/router'
import type React from 'react'
import { useMemo } from 'react'
import { usePurchaseJackpotTicket } from './usePurchaseJackpotTicketMutation' // Import the combined hook
import formatAmount from 'app/utils/formatAmount'
import { toNiceError } from 'app/utils/toNiceError'
import { useQueryClient } from '@tanstack/react-query' // For cache invalidation
import { useSendAccount } from 'app/utils/send-accounts' // Hook to get sender/recipient address
import type { Address } from 'viem'
import { formatUnits } from 'viem' // Needed for fee formatting
import {
  useReadBaseJackpotToken,
  useReadBaseJackpotTokenDecimals, // Import the decimals hook
} from '@my/wagmi/contracts/base-jackpot' // To get token address

const currencySymbol = 'SEND'

type ConfirmBuyTicketsScreenParams = {
  numberOfTickets: string // Route params are strings
}

const { useParam } = createParam<ConfirmBuyTicketsScreenParams>()

export function ConfirmBuyTicketsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToastController() // Get the toast controller instance
  const [rawNumberOfTickets] = useParam('numberOfTickets')
  const numberOfTickets = Number.parseInt(rawNumberOfTickets || '0', 10)

  const { data: sendAccount } = useSendAccount()
  const recipientAddress = useMemo(() => sendAccount?.address, [sendAccount?.address])

  // Fetch the token address used by the jackpot contract
  const {
    data: paymentTokenAddress,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useReadBaseJackpotToken()

  // Fetch the token decimals
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  const {
    isPreparing,
    prepareError,
    usdcFees,
    ticketPrice,
    userOp,
    purchaseAsync,
    isPurchasing,
    purchaseError,
  } = usePurchaseJackpotTicket(
    {
      // Preparation args
      tokenAddress: paymentTokenAddress as Address,
      quantity: numberOfTickets,
      recipient: recipientAddress,
    },
    {
      // Mutation options
      onSuccess: () => {
        console.log('Purchase successful')
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['userJackpotSummary'] })
        queryClient.invalidateQueries({ queryKey: ['userBalance'] }) // Assuming balance query key
        toast.show('Purchase Successful', {
          message: `Successfully bought ${numberOfTickets} ticket${
            numberOfTickets > 1 ? 's' : ''
          }.`,
        })
        router.push('/play')
      },
      onError: (error) => {
        console.error('Purchase mutation failed:', error) // Log specific error source
        toast.show('Purchase Failed', {
          message: toNiceError(error),
          type: 'error', // Assuming 'error' type exists
        })
      },
    }
  )

  // Link back to the buy tickets screen
  const backLink = useLink({
    href: `/play/buy-tickets?numberOfTickets=${numberOfTickets}`,
  })

  const handleConfirmPurchase = async () => {
    if (numberOfTickets <= 0) {
      console.error('Invalid jackpotId or numberOfTickets')
      return
    }
    if (!userOp) {
      console.error('UserOp is not prepared')
      return
    }

    // Retrieve webauthnCreds from the sendAccount data
    const webauthnCreds =
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

    if (webauthnCreds.length === 0) {
      console.error('No WebAuthn credentials found for the account.')
      toast.show('Error', { message: 'No Passkey found for this account.', type: 'error' })
      return
    }

    // Call the mutation with the prepared userOp and the credentials
    await purchaseAsync({ webauthnCreds }) // Call the new async function
    // onSuccess and onError handlers in usePurchaseJackpotTicketMutation handle the rest
  }

  const ticketPriceBn = ticketPrice ? (ticketPrice as bigint) : 0n
  // Ensure ticketPriceBn is a BigInt before multiplying
  const totalCost = ticketPriceBn * BigInt(numberOfTickets)

  // Use fetched decimals, default to 18 if loading or undefined
  const decimalsToUse = typeof tokenDecimals === 'number' ? tokenDecimals : 18

  const formattedTotalCost = `${formatAmount(
    formatUnits(totalCost, decimalsToUse)
  )} ${currencySymbol}`
  const formattedTicketPrice = `${formatAmount(
    formatUnits(ticketPriceBn, decimalsToUse)
  )} ${currencySymbol}`
  // Ensure decimals is a number before formatting fee
  // Use the usdcFees obtained from the preparation hook
  const feeDecimals = typeof usdcFees?.decimals === 'number' ? usdcFees.decimals : 6 // Default USDC decimals
  const formattedFee = usdcFees
    ? `~${formatAmount(formatUnits(usdcFees.baseFee + usdcFees.gasFees, feeDecimals))} USDC`
    : '...'

  // --- Loading and Error States ---
  // Combined loading state for preparation
  const isLoadingPrep = isLoadingToken || isPreparing || isLoadingDecimals

  // Show spinner during initial preparation
  if (isLoadingPrep && (!paymentTokenAddress || tokenDecimals === undefined)) {
    return (
      <YStack f={1} jc="center" ai="center" space>
        <Spinner size="large" />
      </YStack>
    )
  }

  // --- Render Logic ---
  // Error could come from preparation or sending
  const combinedError = tokenError || prepareError || purchaseError
  // TODO: Implement actual balance check against totalCost + usdcFees?.totalFee
  const hasSufficientBalance = true // Assume true for now
  // Ready to attempt purchase if userOp is prepared (even if fees are still loading briefly)
  const isPrepReady = !!userOp && !!paymentTokenAddress && tokenDecimals !== undefined
  // Can submit if preparation is ready, not currently sending, and balance is sufficient
  const canSubmit = isPrepReady && !isPurchasing && hasSufficientBalance && numberOfTickets > 0

  return (
    // Removed HomeLayout wrapper and outer YStack
    <YStack f={1} py="$6" gap="$6" w="100%" maxWidth={600} jc="space-between">
      {/* Kept inner YStack for content */}
      <YStack space="$4">
        {/* Removed H2 as it's likely in TopNav now */}

        <Card p="$4" space="$3" elevation="$2">
          <Row label="Tickets" value={formatAmount(numberOfTickets)} />
          <Row label="Price per Ticket" value={formattedTicketPrice} />
          <Separator />
          <Row label="Total Cost" value={formattedTotalCost} isTotal />
          <Row label="Est. Fee" value={formattedFee} />
        </Card>

        {combinedError && (
          <Paragraph theme="red" ta="center">
            {toNiceError(combinedError)}
          </Paragraph>
        )}
        {!hasSufficientBalance && !combinedError && (
          <Paragraph theme="red" ta="center">
            Insufficient balance to complete purchase.
          </Paragraph>
        )}
      </YStack>

      <YStack space="$3" mt="$4">
        <Button
          theme={!hasSufficientBalance && !combinedError ? 'red_alt1' : 'green'}
          onPress={handleConfirmPurchase}
          disabled={!canSubmit} // Disable based on combined readiness and sending state
          disabledStyle={{ opacity: 0.5 }}
          icon={isPurchasing || (isLoadingPrep && !combinedError) ? <Spinner /> : undefined} // Show spinner if purchasing OR still preparing
        >
          {(() => {
            // Prioritize showing spinner if still preparing essential data
            if (isLoadingPrep && !combinedError && !userOp) {
              return 'Preparing...'
            }
            if (!hasSufficientBalance && !combinedError) {
              return 'Insufficient Balance'
            }
            if (isPurchasing) {
              return 'Processing...'
            }
            // If prep failed, show error indication or allow retry? For now, just show label.
            if (prepareError || tokenError) {
              return 'Error Preparing' // Or just the normal label, error is shown above
            }
            return `Buy ${numberOfTickets} Ticket${numberOfTickets > 1 ? 's' : ''}`
          })()}
        </Button>
        <Button
          chromeless
          transparent
          onPress={backLink.onPress}
          disabled={isPurchasing}
          hoverStyle={{ bg: 'transparent' }}
          pressStyle={{ bg: 'transparent' }}
        >
          Cancel
        </Button>
      </YStack>
      {/* Removed closing tags for HomeLayout and outer YStack */}
    </YStack>
  )
}

// Reusable Row component (similar to SwapSummaryScreen)
const Row = ({
  label,
  value,
  isTotal = false,
}: {
  label: string
  value: React.ReactNode
  isTotal?: boolean
}) => {
  // Use fow on Paragraph, size on Text
  const valueProps = isTotal ? { size: '$6' } : { size: '$5' }

  return (
    <XStack gap="$2.5" jc="space-between" ai="center" flexWrap="wrap">
      <Paragraph size="$5" color="$color11" fow={isTotal ? '700' : 'normal'}>
        {label}
      </Paragraph>
      <Text {...valueProps}>{value}</Text>
    </XStack>
  )
}
