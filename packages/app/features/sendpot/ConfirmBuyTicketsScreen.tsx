import {
  Button,
  Paragraph,
  Spinner,
  XStack,
  YStack,
  Separator,
  FadeCard,
  useToastController,
} from '@my/ui'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { usePurchaseJackpotTicket } from './hooks/usePurchaseJackpotTicketMutation'
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
import { MAX_JACKPOT_HISTORY } from 'app/data/sendpot'

const currencySymbol = 'SEND'

type ConfirmBuyTicketsScreenParams = {
  numberOfTickets: string
}

const { useParam } = createParam<ConfirmBuyTicketsScreenParams>()

export function ConfirmBuyTicketsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const [rawNumberOfTickets] = useParam('numberOfTickets')
  const numberOfTickets = Number.parseInt(rawNumberOfTickets || '0', 10) || 0

  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const recipientAddress = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const {
    data: paymentTokenAddress,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useReadBaseJackpotToken()

  const {
    data: tokenDecimals,
    isLoading: isLoadingDecimals,
    error: decimalsError,
  } = useReadBaseJackpotTokenDecimals()

  const {
    isPreparing,
    prepareError,
    userOp,
    refetchPrepare,
    purchaseAsync,
    isPurchasing,
    purchaseError,
    usdcFees,
    ticketPrice,
  } = usePurchaseJackpotTicket(
    {
      tokenAddress: paymentTokenAddress as Address,
      quantity: numberOfTickets,
      recipient: recipientAddress,
    },
    {
      onSuccess: () => {
        console.log('Purchase successful')
        queryClient.invalidateQueries({ queryKey: ['userJackpotSummary', MAX_JACKPOT_HISTORY] })
        toast.show('Purchase Successful', {
          message: `Successfully bought ${numberOfTickets} ticket${
            numberOfTickets > 1 ? 's' : ''
          }.`,
        })
        router.push('/sendpot')
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

  const handleConfirmPurchase = async () => {
    if (numberOfTickets <= 0) {
      console.error('Invalid jackpotId or numberOfTickets')
      return
    }
    // if we never prepared or the last prepare errored, re‐run it
    if (!userOp) {
      await refetchPrepare()
    }

    if (!userOp) {
      console.error('UserOp is not prepared')
      return
    }

    const webauthnCreds =
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

    if (webauthnCreds.length === 0) {
      console.error('No WebAuthn credentials found for the account.')
      toast.show('Error', { message: 'No Passkey found for this account.', type: 'error' })
      return
    }

    await purchaseAsync({ webauthnCreds })
  }

  const ticketPriceBn = ticketPrice ? (ticketPrice as bigint) : 0n
  const totalCost = ticketPriceBn * BigInt(numberOfTickets)
  const decimalsToUse = typeof tokenDecimals === 'number' ? tokenDecimals : 18

  const formattedTotalCost = formatAmount(formatUnits(totalCost, decimalsToUse))
  const formattedTicketPrice = formatAmount(formatUnits(ticketPriceBn, decimalsToUse))
  const ticketsToShow: number = numberOfTickets > 0 ? numberOfTickets : 0

  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER)
  const feeDecimals = typeof usdcFees?.decimals === 'number' ? usdcFees.decimals : 6

  const initLoading = isLoadingToken || isLoadingDecimals || isSendAccountLoading || isPreparing

  if (initLoading && (!paymentTokenAddress || tokenDecimals === undefined)) {
    return <Spinner size="large" color="$olive" />
  }

  const combinedError = tokenError || decimalsError || prepareError || purchaseError
  const hasSufficientBalance = true
  const hasSufficientGas = true

  const canSubmit =
    !initLoading &&
    !isPurchasing &&
    hasSufficientBalance &&
    hasSufficientGas &&
    !!userOp &&
    numberOfTickets > 0

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
      <YStack gap="$3.5">
        <FadeCard>
          <YStack gap="$3">
            <XStack ai={'center'} jc={'space-between'}>
              <Paragraph size={'$5'} color={'$color11'}>
                Tickets
              </Paragraph>
              <EditButton />
            </XStack>
            <Paragraph
              testID={'numberOfTickets'}
              width={'100%'}
              ff={'$mono'}
              size={'$9'}
              $gtSm={{ size: '$9' }}
            >
              {ticketsToShow.toString()}
            </Paragraph>
          </YStack>
        </FadeCard>

        <FadeCard>
          <YStack gap={'$2'}>
            <Row label="Price per Ticket" value={`${formattedTicketPrice} ${currencySymbol}`} />
            <Row label="Total Cost" value={`${formattedTotalCost} ${currencySymbol}`} isTotal />
            <Separator my="$2" />
            <Row
              label={'Est. Transaction Fee'}
              value={(() => {
                if (!usdcFees) {
                  return '-'
                }
                return `${formatAmount(formatUnits(gas, feeDecimals))} USDC`
              })()}
            />
          </YStack>
        </FadeCard>

        <Paragraph color="$error" mt="$2" ta="center">
          {combinedError
            ? toNiceError(combinedError)
            : !hasSufficientBalance
              ? 'Insufficient balance.'
              : !hasSufficientGas
                ? 'Insufficient gas.'
                : ''}
        </Paragraph>
      </YStack>

      <Button
        theme={
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
        {isPurchasing || (initLoading && !combinedError) ? (
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
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
            insufficient balance
          </Button.Text>
        ) : !hasSufficientGas && !combinedError ? (
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
            insufficient gas
          </Button.Text>
        ) : (
          <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
            {`Buy ${numberOfTickets} Ticket${numberOfTickets > 1 ? 's' : ''}`}
          </Button.Text>
        )}
      </Button>
    </YStack>
  )
}

export const Row = ({
  label,
  value,
  testID,
  isTotal = false,
}: {
  label: string
  value: ReactNode
  testID?: string
  isTotal?: boolean
}) => {
  return (
    <XStack gap={'$2.5'} jc={'space-between'} flexWrap={'wrap'} ai="center">
      <Paragraph size={'$5'} color={'$color11'} fow={isTotal ? '700' : 'normal'}>
        {label}
      </Paragraph>
      <XStack gap={'$2.5'} flexWrap={'wrap'} flexShrink={1}>
        <Paragraph testID={testID} size={isTotal ? '$6' : '$5'} fow={isTotal ? '700' : 'normal'}>
          {value}
        </Paragraph>
      </XStack>
    </XStack>
  )
}

export const EditButton = () => {
  const router = useRouter()
  const [rawNumberOfTickets] = useParam('numberOfTickets')

  const handlePress = () => {
    router.push({
      pathname: '/sendpot/buy-tickets',
      query: { numberOfTickets: rawNumberOfTickets },
    })
  }

  return (
    <Button
      unstyled
      chromeless
      backgroundColor="transparent"
      hoverStyle={{ bg: 'transparent' }}
      pressStyle={{ bg: 'transparent' }}
      focusStyle={{ outlineStyle: 'none' }}
      p={0}
      bw={0}
      height={'auto'}
      onPress={handlePress}
      accessibilityLabel="Edit number of tickets"
    >
      <Button.Text size={'$5'} color="$color11" hoverStyle={{ color: '$primary' }}>
        edit
      </Button.Text>
    </Button>
  )
}
