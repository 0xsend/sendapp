import {
  Button,
  Paragraph,
  XStack,
  YStack,
  Card,
  Spinner,
  H3,
  useAppToast,
} from '@my/ui'
import { useMemo, useCallback } from 'react'
import { useClaimableWinnings } from './hooks/useClaimableWinnings'
import { useWithdrawWinnings } from './hooks/useWithdrawWinningsMutation'
import { useSendAccount } from 'app/utils/send-accounts'
import { formatUnits } from 'viem'
import { useReadBaseJackpotTokenDecimals } from '@my/wagmi/contracts/base-jackpot'
import { toNiceError } from 'app/utils/toNiceError'
import { useQueryClient } from '@tanstack/react-query'
import { MAX_JACKPOT_HISTORY } from 'app/data/sendpot'

export const ClaimWinnings = () => {
  const toast = useAppToast()
  const queryClient = useQueryClient()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { winningsClaimable, hasClaimableWinnings, isLoading: isLoadingWinnings } =
    useClaimableWinnings()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  const {
    isPreparing,
    prepareError,
    userOp,
    refetchPrepare,
    withdrawAsync,
    isWithdrawing,
    withdrawError,
    usdcFees,
  } = useWithdrawWinnings({
    onSuccess: () => {
      console.log('Withdrawal successful')
      queryClient.invalidateQueries({ queryKey: ['userJackpotSummary', MAX_JACKPOT_HISTORY] })
      toast.show('Claim Successful', {
        message: 'Successfully claimed your winnings!',
      })
    },
    onError: (error) => {
      console.error('Withdrawal mutation failed:', error)
      toast.error('Claim Failed', {
        message: toNiceError(error),
      })
    },
  })

  const formattedWinnings = useMemo(() => {
    if (typeof winningsClaimable !== 'bigint' || tokenDecimals === undefined) {
      return '...'
    }
    return Number.parseFloat(
      formatUnits(winningsClaimable, Number(tokenDecimals))
    ).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  }, [winningsClaimable, tokenDecimals])

  const handleClaim = useCallback(async () => {
    // If we never prepared or the last prepare errored, re-run it
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
      toast.error('Error', { message: 'No Passkey found for this account.' })
      return
    }

    await withdrawAsync({ webauthnCreds })
  }, [userOp, refetchPrepare, sendAccount, withdrawAsync, toast])

  const isLoading = isLoadingWinnings || isLoadingDecimals || isSendAccountLoading
  const combinedError = prepareError || withdrawError
  const canClaim = !isLoading && !isWithdrawing && !isPreparing && hasClaimableWinnings && !!userOp

  // Don't show the card if there are no winnings to claim
  if (!isLoading && !hasClaimableWinnings) {
    return null
  }

  return (
    <Card padding={'$5'} w={'100%'} $gtLg={{ padding: '$6' }}>
      <YStack gap={'$4'} w={'100%'}>
        <YStack gap={'$2'}>
          <H3 color="$color11" fontWeight={'500'} textTransform={'uppercase'}>
            You Won!
          </H3>
          <XStack gap={'$2.5'} ai="baseline">
            <Paragraph
              fontSize={48}
              $gtSm={{ fontSize: 56 }}
              fontWeight={'600'}
              color={'$green10'}
            >
              {isLoading ? <Spinner /> : formattedWinnings}
            </Paragraph>
            <Paragraph fontSize={'$6'} fontWeight={'500'} color={'$green10'}>
              SEND
            </Paragraph>
          </XStack>
        </YStack>

        <XStack w="100%" gap="$2">
          <Button
            onPress={handleClaim}
            theme={'green'}
            br="$4"
            px={'$3.5'}
            h={'$4.5'}
            disabled={!canClaim}
            disabledStyle={{ opacity: 0.5 }}
            f={1}
            maw={350}
          >
            {isWithdrawing || isPreparing ? (
              <>
                <Button.Icon>
                  <Spinner size="small" color="$color12" mr={'$2'} />
                </Button.Icon>
                <Button.Text fontWeight={'400'} tt="uppercase" size={'$5'} color={'$black'}>
                  {isWithdrawing ? 'Claiming...' : 'Preparing...'}
                </Button.Text>
              </>
            ) : (
              <Button.Text fontWeight={'400'} tt="uppercase" size={'$5'} color={'$black'}>
                Claim Winnings
              </Button.Text>
            )}
          </Button>
        </XStack>

        {combinedError && (
          <Paragraph color="$error" fontSize="$3" textAlign="left">
            {toNiceError(combinedError)}
          </Paragraph>
        )}

        {usdcFees && (
          <Paragraph color="$color10" fontSize="$3" textAlign="left">
            Est. gas fee:{' '}
            {Number.parseFloat(
              formatUnits(
                usdcFees.baseFee + usdcFees.gasFees,
                typeof usdcFees.decimals === 'number' ? usdcFees.decimals : 6
              )
            ).toFixed(2)}{' '}
            USDC
          </Paragraph>
        )}
      </YStack>
    </Card>
  )
}
