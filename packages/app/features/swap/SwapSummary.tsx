import { Button, FadeCard, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import type { KyberRouteSummary } from '@my/api/routers/swap/types'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import { useCoin, useCoins } from 'app/provider/coins'
import { useSwapScreenParams } from 'app/routers/params'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useSendAccount } from 'app/utils/send-accounts'
import { api } from 'app/utils/api'
import { useSwap } from 'app/features/swap/hooks/useSwap'
import { useSendUserOpMutation } from 'app/utils/sendUserOp'
import { useCallback, useEffect } from 'react'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useRouter } from 'solito/router'
import { useQueryClient } from '@tanstack/react-query'
import { DEFAULT_SLIPPAGE, SWAP_ROUTE_SUMMARY_QUERY_KEY } from 'app/features/swap/constants'

// TODO edit
// todo jakis kurwa problem z senderem
// todo mobile
// todo white

export const SwapSummary = () => {
  const router = useRouter()
  const [swapParams] = useSwapScreenParams()
  const { isLoading: isLoadingCoins } = useCoins()
  const { outToken, inToken, inAmount, slippage } = swapParams
  const { coin: inCoin } = useCoin(inToken)
  const { coin: outCoin } = useCoin(outToken)
  const { coin: usdc } = useCoin('USDC')
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { tokensQuery, ethQuery } = useCoinFromSendTokenParam()
  const queryClient = useQueryClient()

  const {
    mutateAsync: encodeRouteMutateAsync,
    data: encodedRoute,
    error: encodeRouteError,
    isPending: isEncodeRouteLoading,
  } = api.swap.encodeSwapRoute.useMutation()

  const { userOp, userOpError, isLoadingUserOp, usdcFees, usdcFeesError, isLoadingUSDCFees } =
    useSwap({
      amount: BigInt(inAmount || '0'),
      token: inToken,
      routerAddress: encodedRoute?.routerAddress,
      swapCallData: encodedRoute?.data,
    })

  const { mutateAsync: sendUserOpMutateAsync, isPending: isSendUserOpPending } =
    useSendUserOpMutation()

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

  const isUSDCSelected = inCoin?.label === 'USDC'
  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER)
  const hasEnoughBalance = inCoin?.balance && inCoin.balance >= BigInt(inAmount ?? '0')
  const hasEnoughGas =
    (usdc?.balance ?? BigInt(0)) > (isUSDCSelected ? BigInt(inAmount || '0') + gas : gas)

  const routeSummary = queryClient.getQueryData<KyberRouteSummary>([SWAP_ROUTE_SUMMARY_QUERY_KEY])
  const amountIn = localizeAmount(
    formatUnits(BigInt(routeSummary?.amountIn || 0), inCoin?.decimals || 0)
  )
  const amountOut = localizeAmount(
    formatUnits(BigInt(routeSummary?.amountOut || 0), outCoin?.decimals || 0)
  )
  const exchangeRate = Number(amountOut.replace(/,/g, '')) / Number(amountIn.replace(/,/g, ''))

  const initLoading =
    isLoadingCoins ||
    isSendAccountLoading ||
    isEncodeRouteLoading ||
    isLoadingUserOp ||
    isLoadingUSDCFees

  const canSubmit =
    !initLoading &&
    !isSendUserOpPending &&
    hasEnoughGas &&
    hasEnoughBalance &&
    encodedRoute &&
    userOp &&
    usdcFees

  const encodeRoute = useCallback(async () => {
    if (!sendAccount?.address || !routeSummary) {
      return
    }

    try {
      await encodeRouteMutateAsync({
        routeSummary,
        slippageTolerance: Number(slippage || DEFAULT_SLIPPAGE),
        sender: sendAccount.address,
        recipient: sendAccount.address,
      })
    } catch (e) {
      console.error(e)
    }
  }, [sendAccount, routeSummary, encodeRouteMutateAsync, slippage, sendAccount?.address])

  const submit = async () => {
    await sendUserOpMutateAsync({
      userOp: {
        ...userOp,
        callGasLimit: 3000000n, // TODO
        preVerificationGas: 100000n, // TODO
      },
      webauthnCreds,
    })

    await tokensQuery.refetch()
    await ethQuery.refetch()
    router.push(`/?token=${outCoin?.token}`)
  }

  useEffect(() => {
    if (!routeSummary) {
      router.push({ pathname: '/swap', query: swapParams })
    }

    if (!isEncodeRouteLoading && !encodedRoute) {
      void encodeRoute()
    }
  }, [routeSummary, swapParams, router.push, encodeRoute, isEncodeRouteLoading, encodedRoute])

  if (initLoading) {
    return <Spinner size="large" color="$olive" />
  }

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
        <YStack gap="$5">
          <Paragraph size={'$7'}>Swap Summary</Paragraph>
          <YStack gap={'$5'} position={'relative'}>
            <FadeCard>
              <XStack ai="center" gap="$2">
                <ArrowUp
                  size={'$1'}
                  color={'$lightGrayTextField'}
                  $theme-light={{ color: '$darkGrayTextField' }}
                />
                <Paragraph
                  fontSize={'$4'}
                  color={'$lightGrayTextField'}
                  $theme-light={{ color: '$darkGrayTextField' }}
                >
                  You Pay
                </Paragraph>
              </XStack>
              <XStack ai={'center'} jc={'space-between'}>
                <Paragraph size={'$9'}>{amountIn}</Paragraph>
                <XStack gap={'$2'} ai={'center'}>
                  <IconCoin symbol={inCoin?.symbol || ''} />
                  <Paragraph size={'$5'}>{inCoin?.symbol}</Paragraph>
                </XStack>
              </XStack>
            </FadeCard>
            <FadeCard>
              <XStack ai="center" gap="$2">
                <ArrowDown
                  size={'$1'}
                  color={'$lightGrayTextField'}
                  $theme-light={{ color: '$darkGrayTextField' }}
                />
                <Paragraph
                  fontSize={'$4'}
                  color={'$lightGrayTextField'}
                  $theme-light={{ color: '$darkGrayTextField' }}
                >
                  You Receive
                </Paragraph>
              </XStack>
              <XStack ai={'center'} jc={'space-between'}>
                <Paragraph size={'$9'}>{amountOut}</Paragraph>
                <XStack gap={'$2'} ai={'center'}>
                  <IconCoin symbol={outCoin?.symbol || ''} />
                  <Paragraph size={'$5'}>{outCoin?.symbol}</Paragraph>
                </XStack>
              </XStack>
            </FadeCard>
            <YStack
              bc={'$color0'}
              position={'absolute'}
              top={'50%'}
              left={'50%'}
              borderRadius={9999}
              transform={'translate(-50%, -50%)'}
              p={'$3.5'}
            >
              <ArrowDown size={'$1'} />
            </YStack>
          </YStack>
          <FadeCard>
            <YStack gap={'$2'}>
              <Row
                label={'Exchange Rate'}
                value={`1 ${inCoin?.symbol} = ${exchangeRate} ${outCoin?.symbol}`}
              />
              <Row
                label={'Transaction Fee'}
                value={`${usdcFees ? formatAmount(formatUnits(gas, usdcFees.decimals)) : '-'} USDC`}
              />
              <Row label={'Send Fee'} value={'0.75%'} />
              <Row
                label={'Max Slippage'}
                value={`${(Number(slippage || DEFAULT_SLIPPAGE) / 100).toString()}%`}
              />
            </YStack>
          </FadeCard>
        </YStack>
        <Paragraph color="$error">
          {(() => {
            switch (true) {
              case !!encodeRouteError:
                return encodeRouteError?.message
              case !!userOpError:
                return userOpError?.message?.split('.').at(0)
              case !!usdcFeesError:
                return usdcFeesError?.message?.split('.').at(0)
              default:
                return ''
            }
          })()}
        </Paragraph>
      </YStack>
      <Button
        theme="green"
        onPress={submit}
        py={'$5'}
        br={'$4'}
        disabledStyle={{ opacity: 0.5 }}
        disabled={!canSubmit}
      >
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          {isSendUserOpPending ? 'swapping...' : 'confirm swap'}
        </Button.Text>
      </Button>
    </YStack>
  )
}

export const Row = ({ label, value }: { label: string; value: string }) => {
  return (
    <XStack gap={'$2.5'} jc={'space-between'} flexWrap={'wrap'}>
      <Paragraph
        size={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {label}
      </Paragraph>
      <XStack gap={'$2.5'} flexWrap={'wrap'} flexShrink={1}>
        <Paragraph size={'$5'}>{value}</Paragraph>
      </XStack>
    </XStack>
  )
}
