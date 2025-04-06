import {
  Button,
  Paragraph,
  Spinner,
  XStack,
  YStack,
  Separator,
  FadeCard, // Use FadeCard like SwapSummaryScreen
  useToastController,
} from '@my/ui'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { usePurchaseJackpotTicket } from './usePurchaseJackpotTicketMutation'
import formatAmount from 'app/utils/formatAmount'
import { toNiceError } from 'app/utils/toNiceError'
import { useQueryClient } from '@tanstack/react-query'
import { useSendAccount } from 'app/utils/send-accounts'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import {
  useReadBaseJackpotToken,
  useReadBaseJackpotTokenDecimals,
} from '@my/wagmi/contracts/base-jackpot'

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
  // Ensure numberOfTickets is a valid number, default to 0 if parsing fails or param is missing
  const numberOfTickets = Number.parseInt(rawNumberOfTickets || '0', 10) || 0

  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount() // Add loading state
  const recipientAddress = useMemo(() => sendAccount?.address, [sendAccount?.address])

  // Fetch the token address used by the jackpot contract
  const {
    data: paymentTokenAddress,
    isLoading: isLoadingToken,
    error: tokenError, // Capture token fetch error
  } = useReadBaseJackpotToken()

  // Fetch the token decimals
  const {
    data: tokenDecimals,
    isLoading: isLoadingDecimals,
    error: decimalsError, // Capture decimals fetch error
  } = useReadBaseJackpotTokenDecimals()

  const {
    isPreparing,
    prepareError,
    // Destructure all necessary values correctly from the hook
    userOp,
    purchaseAsync,
    isPurchasing,
    purchaseError,
    usdcFees,
    // Removed usdcFeesError and isLoadingUSDCFees
    ticketPrice,
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
        console.error('Purchase mutation failed:', error)
        toast.show('Purchase Failed', {
          message: toNiceError(error),
          type: 'error',
        })
      },
    }
  )

  // No need for backLink with EditButton pattern

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
    await purchaseAsync({ webauthnCreds })
  }

  // Calculations (ensure types are handled correctly)
  const ticketPriceBn = ticketPrice ? (ticketPrice as bigint) : 0n
  const totalCost = ticketPriceBn * BigInt(numberOfTickets)
  const decimalsToUse = typeof tokenDecimals === 'number' ? tokenDecimals : 18 // Default if loading/error

  // Format amounts using decimals
  // Use localizeAmount if needed for display consistency, otherwise formatAmount is fine
  const formattedTotalCost = formatAmount(formatUnits(totalCost, decimalsToUse))
  const formattedTicketPrice = formatAmount(formatUnits(ticketPriceBn, decimalsToUse))
  // Calculate the number of tickets to display first, explicitly typing as number
  const ticketsToShow: number = numberOfTickets > 0 ? numberOfTickets : 0
  // Removed intermediate string variable

  // Format fees
  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER) // Use MAX_SAFE_INTEGER as fallback like SwapSummary
  const feeDecimals = typeof usdcFees?.decimals === 'number' ? usdcFees.decimals : 6 // Default USDC decimals

  // --- Loading and Error States ---
  // Adjusted loading state (removed isLoadingUSDCFees)
  const initLoading = isLoadingToken || isLoadingDecimals || isSendAccountLoading || isPreparing

  // Show main spinner if essential data is loading initially
  if (initLoading && (!paymentTokenAddress || tokenDecimals === undefined)) {
    return <Spinner size="large" color="$olive" /> // Match SwapSummaryScreen spinner
  }

  // --- Render Logic ---
  // Adjusted combinedError calculation (removed usdcFeesError)
  const combinedError = tokenError || decimalsError || prepareError || purchaseError
  // TODO: Implement actual balance check
  const hasSufficientBalance = true // Placeholder
  const hasSufficientGas = true // Placeholder for gas check (compare usdcFees.totalFee with USDC balance)

  // Determine if the transaction can be submitted
  const canSubmit =
    !initLoading &&
    !isPurchasing &&
    hasSufficientBalance &&
    hasSufficientGas &&
    !!userOp && // Ensure userOp is ready
    numberOfTickets > 0 && // Ensure valid number of tickets
    !combinedError // Ensure no critical errors occurred

  return (
    <YStack
      w={'100%'}
      gap="$5"
      pb={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        w: '50%',
      }}
    >
      {/* Content section */}
      <YStack gap="$3.5">
        {/* Use FadeCard for summary details */}
        <FadeCard>
          <YStack gap="$3">
            {/* Row for Number of Tickets with Edit Button */}
            <XStack ai={'center'} jc={'space-between'}>
              <Paragraph size={'$5'} color={'$color11'}>
                Tickets
              </Paragraph>
              <EditButton /> {/* Ensure EditButton is defined correctly */}
            </XStack>
            <Paragraph
              testID={'numberOfTickets'}
              width={'100%'}
              ff={'$mono'}
              size={'$9'} // Large size for primary info
              $gtSm={{ size: '$9' }} // Consistent size on larger screens
            >
              {/* Embed toString() call directly */}
              {ticketsToShow.toString()}
            </Paragraph>
          </YStack>
        </FadeCard>

        {/* Second FadeCard for cost breakdown */}
        <FadeCard>
          <YStack gap={'$2'}>
            <Row label="Price per Ticket" value={`${formattedTicketPrice} ${currencySymbol}`} />
            <Row label="Total Cost" value={`${formattedTotalCost} ${currencySymbol}`} isTotal />
            <Separator my="$2" /> {/* Add separator */}
            <Row
              label={'Est. Transaction Fee'}
              value={(() => {
                // Simplified fee display logic
                if (!usdcFees) {
                  return '-' // Show dash if fees aren't calculated yet
                }
                // Format gas fee similar to SwapSummaryScreen
                return `${formatAmount(formatUnits(gas, feeDecimals))} USDC`
                // Correctly close the IIFE
              })()}
            />
            {/* Add Send Fee if applicable */}
            {/* <Row label={'Send Fee'} value={'0.75%'} /> */}
          </YStack>
        </FadeCard>

        {/* Error display area */}
        <Paragraph color="$error" mt="$2" ta="center">
          {/* Display combined error or specific messages */}
          {combinedError
            ? toNiceError(combinedError)
            : !hasSufficientBalance
              ? 'Insufficient balance.'
              : !hasSufficientGas
                ? 'Insufficient gas.'
                : ''}
        </Paragraph>
      </YStack>

      {/* Action Button Area */}
      <Button
        theme={
          // Ensure boolean logic is sound: if ((!balance or !gas) AND not loading AND no error) then red, else green
          (!hasSufficientBalance || !hasSufficientGas) && !initLoading && !combinedError
            ? 'red_alt1'
            : 'green'
        }
        onPress={handleConfirmPurchase}
        py={'$5'}
        br={'$4'}
        disabledStyle={{ opacity: 0.5 }}
        disabled={!canSubmit}
      >
        {/* Simplified Button Content Logic using ternary operators */}
        {isPurchasing || (initLoading && !combinedError) ? (
          // Loading state
          <>
            <Button.Icon>
              <Spinner size="small" color="$color12" mr={'$2'} />
            </Button.Icon>
            <Button.Text
              ff={'$mono'}
              fontWeight={'500'}
              tt="uppercase"
              size={'$5'}
              color={'$black'}
            >
              {isPurchasing ? 'Processing...' : 'Preparing...'}
            </Button.Text>
          </>
        ) : !hasSufficientBalance && !combinedError ? (
          // Insufficient Balance state
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
            insufficient balance
          </Button.Text>
        ) : !hasSufficientGas && !combinedError ? (
          // Insufficient Gas state
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
            insufficient gas
          </Button.Text>
        ) : (
          // Default action text
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
            {`Buy ${numberOfTickets} Ticket${numberOfTickets > 1 ? 's' : ''}`}
          </Button.Text>
        )}
      </Button>
      {/* Cancel button removed in favor of EditButton pattern */}
    </YStack> // Closing tag for the main content YStack
  ) // Closing parenthesis for the return statement
} // Closing brace for the ConfirmBuyTicketsScreen function

// Reusable Row component matching SwapSummaryScreen style
export const Row = ({
  label,
  value,
  testID,
  isTotal = false, // Added isTotal prop for potential styling differences
}: {
  label: string
  value: ReactNode
  testID?: string
  isTotal?: boolean // Optional prop
}) => {
  return (
    <XStack gap={'$2.5'} jc={'space-between'} flexWrap={'wrap'} ai="center">
      <Paragraph
        size={'$5'}
        color={'$color11'} // Use a consistent secondary text color
        fow={isTotal ? '700' : 'normal'} // Make total label bold
      >
        {label}
      </Paragraph>
      {/* Wrap value in XStack for potential icons/complex values */}
      <XStack gap={'$2.5'} flexWrap={'wrap'} flexShrink={1}>
        <Paragraph
          testID={testID}
          size={isTotal ? '$6' : '$5'} // Make total value slightly larger
          fow={isTotal ? '700' : 'normal'} // Make total value bold
        >
          {value}
        </Paragraph>
      </XStack>
    </XStack> // Ensure this closing tag is present for the Row component's outer XStack
  )
}

// EditButton component matching SwapSummaryScreen
export const EditButton = () => {
  const router = useRouter()
  const [rawNumberOfTickets] = useParam('numberOfTickets') // Get param to pass back

  const handlePress = () => {
    // Navigate back to the screen where the number of tickets can be edited
    router.push({ pathname: '/play/buy-tickets', query: { numberOfTickets: rawNumberOfTickets } })
  }

  return (
    <Button
      unstyled // Use unstyled and apply styles directly or via props
      chromeless
      backgroundColor="transparent"
      // Apply hover/press styles directly to Button or Button.Text as appropriate
      hoverStyle={{ bg: 'transparent' }} // Apply to Button
      pressStyle={{ bg: 'transparent' }} // Apply to Button
      focusStyle={{ outlineStyle: 'none' }} // Remove focus ring if desired
      p={0}
      bw={0}
      height={'auto'}
      onPress={handlePress}
      accessibilityLabel="Edit number of tickets" // Accessibility
    >
      {/* Apply text color and hover style to Button.Text */}
      <Button.Text size={'$5'} color="$color11" hoverStyle={{ color: '$primary' }}>
        edit
      </Button.Text>
    </Button>
  )
}
