import {
  FadeCard,
  H2,
  Paragraph,
  PrimaryButton,
  Spinner,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { useCallback, useMemo } from 'react'
import { useClaimableWinnings } from './hooks/useClaimableWinnings'
import { useWithdrawWinnings } from './hooks/useWithdrawWinningsMutation'
import { useSendAccount } from 'app/utils/send-accounts'
import { formatUnits } from 'viem'
import { useReadBaseJackpotTokenDecimals } from '@my/wagmi/contracts/base-jackpot'
import { toNiceError } from 'app/utils/toNiceError'
import { useQueryClient } from '@tanstack/react-query'
import { MAX_JACKPOT_HISTORY } from 'app/data/sendpot'
import { IconCoin } from 'app/components/icons/IconCoin'

export const ClaimWinnings = () => {
  const toast = useAppToast()
  const queryClient = useQueryClient()
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const {
    winningsClaimable,
    hasClaimableWinnings,
    isLoading: isLoadingWinnings,
  } = useClaimableWinnings()
  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadBaseJackpotTokenDecimals()

  const {
    isPreparing,
    prepareError,
    userOp,
    refetchPrepare,
    withdrawAsync,
    isWithdrawing,
    withdrawError,
  } = useWithdrawWinnings({
    onSuccess: () => {
      console.log('Withdrawal successful')
      queryClient.invalidateQueries({ queryKey: ['userJackpotSummary', MAX_JACKPOT_HISTORY] })
      toast.show('Claim Successful')
    },
    onError: (error) => {
      console.error('Withdrawal mutation failed:', error)
      toast.error('Claim Failed')
    },
  })

  const formattedWinnings = useMemo(() => {
    if (typeof winningsClaimable !== 'bigint' || tokenDecimals === undefined) {
      return '...'
    }
    return Number.parseFloat(formatUnits(winningsClaimable, Number(tokenDecimals))).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 0,
      }
    )
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

  return (
    <FadeCard gap={'$7'} $gtLg={{ p: '$7', gap: '$7' }}>
      <H2 fontWeight="600">You won!</H2>
      <XStack alignItems={'center'} gap={'$2'} justifyContent={'center'}>
        <Paragraph size={'$12'} fontWeight={600}>
          {formattedWinnings}
        </Paragraph>
        <IconCoin symbol="SEND" size={'$4'} />
      </XStack>
      <YStack gap={'$3'}>
        <PrimaryButton onPress={handleClaim} disabled={!canClaim}>
          {isWithdrawing || isPreparing ? (
            <>
              <PrimaryButton.Icon>
                <Spinner size="small" color="$color12" mr={'$2'} />
              </PrimaryButton.Icon>
              <PrimaryButton.Text>
                {isWithdrawing ? 'Claiming...' : 'Preparing...'}
              </PrimaryButton.Text>
            </>
          ) : (
            <PrimaryButton.Text>Claim Winnings</PrimaryButton.Text>
          )}
        </PrimaryButton>
        {combinedError && (
          <Paragraph color="$error" fontSize="$3">
            {toNiceError(combinedError)}
          </Paragraph>
        )}
      </YStack>
    </FadeCard>
  )
}
