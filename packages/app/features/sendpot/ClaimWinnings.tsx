import {
  Button,
  Paragraph,
  XStack,
  YStack,
  Card,
  Spinner,
  Label,
  BigHeading,
  Stack,
  styled,
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

const GreenSquare = styled(Stack, {
  name: 'Surface',
  w: 11,
  h: 11,
  theme: 'green_active',
  bc: '$background',
})

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

  return (
    <Card
      padding={'$5'}
      w={'100%'}
      jc="space-between"
      $gtLg={{ padding: '$6', height: 'auto', minHeight: 244 }}
      minHeight={184}
    >
      <XStack w={'100%'} zIndex={4} h="100%">
        <YStack gap={'$2'} w={'100%'}>
          <YStack gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} gap="$2.5" width={'100%'}>
              <XStack ai={'center'} gap="$2.5">
                <GreenSquare />
                <Label
                  fontSize={'$4'}
                  zIndex={1}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  lineHeight={0}
                  color={'$color10'}
                >
                  You Won!
                </Label>
              </XStack>
            </XStack>
          </YStack>
          <XStack style={{ color: 'white' }} gap={'$2.5'} mt="auto">
            <BigHeading
              $platform-web={{ width: 'fit-content' }}
              fontSize={64}
              $gtSm={{ fontSize: 80 }}
              $gtMd={{ fontSize: 96 }}
              fontWeight={'600'}
              color={'$green10'}
              zIndex={1}
            >
              {isLoading ? <Spinner /> : formattedWinnings}
            </BigHeading>
            <Paragraph fontSize={'$6'} fontWeight={'500'} zIndex={1} $sm={{ marginTop: '$4' }}>
              SEND
            </Paragraph>
          </XStack>

          <XStack w="100%" mt="$2">
            <Stack f={1} w="100%" maw={350} gap="$2">
              <Button
                onPress={handleClaim}
                theme={'green'}
                br="$4"
                px={'$3.5'}
                h={'$4.5'}
                disabled={!canClaim}
                disabledStyle={{ opacity: 0.5 }}
                animation="200ms"
                enterStyle={{
                  opacity: 0,
                }}
                exitStyle={{
                  opacity: 0,
                }}
              >
                {isWithdrawing || isPreparing ? (
                  <>
                    <Button.Icon>
                      <Spinner size="small" color="$color12" mr={'$2'} />
                    </Button.Icon>
                    <Button.Text
                      fontWeight={'400'}
                      $theme-dark={{ col: '$color0' }}
                      tt="uppercase"
                      size={'$5'}
                    >
                      {isWithdrawing ? 'Claiming...' : 'Preparing...'}
                    </Button.Text>
                  </>
                ) : (
                  <Button.Text
                    fontWeight={'400'}
                    $theme-dark={{ col: '$color0' }}
                    tt="uppercase"
                    size={'$5'}
                  >
                    Claim Winnings
                  </Button.Text>
                )}
              </Button>
              {combinedError && (
                <Paragraph color="$red10Dark" fontSize="$3" textAlign="center">
                  {toNiceError(combinedError)}
                </Paragraph>
              )}
            </Stack>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  )
}
