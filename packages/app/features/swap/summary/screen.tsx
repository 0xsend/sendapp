import { Button, FadeCard, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { ArrowDown } from '@tamagui/lucide-icons'
import type { KyberRouteSummary } from '@my/api/src/routers/swap/types'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import { useCoin, useCoins } from 'app/provider/coins'
import { useSwapScreenParams } from 'app/routers/params'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useSendAccount } from 'app/utils/send-accounts'
import { api } from 'app/utils/api'
import { useSwap } from 'app/features/swap/hooks/useSwap'
import { useSendUserOpMutation } from 'app/utils/sendUserOp'
import { type ReactNode, useCallback, useEffect } from 'react'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useRouter } from 'solito/router'
import { useQueryClient } from '@tanstack/react-query'
import { DEFAULT_SLIPPAGE, SWAP_ROUTE_SUMMARY_QUERY_KEY } from 'app/features/swap/constants'
import { baseMainnet } from '@my/wagmi'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'

export const SwapSummaryScreen = () => {
  const router = useRouter()
  const [swapParams] = useSwapScreenParams()
  const { isLoading: isLoadingCoins } = useCoins()
  const { outToken, inToken, inAmount, slippage } = swapParams
  const { coin: outCoin } = useCoin(outToken)
  const { coin: inCoin } = useCoin(inToken)
  const { coin: usdc } = useCoin('USDC')
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { tokensQuery, ethQuery } = useCoinFromSendTokenParam()
  const queryClient = useQueryClient()

  const {
    mutateAsync: encodeRouteMutateAsync,
    data: encodedRoute,
    error: encodeRouteError,
    isPending: isEncodeRouteLoading,
    status: encodeRouteStatus,
  } = api.swap.encodeSwapRoute.useMutation()

  const { userOp, userOpError, isLoadingUserOp, usdcFees, usdcFeesError, isLoadingUSDCFees } =
    useSwap({
      amount: BigInt(inAmount || '0'),
      token: inToken,
      routerAddress: encodedRoute?.routerAddress,
      swapCallData: encodedRoute?.data,
    })

  const {
    mutateAsync: sendUserOpMutateAsync,
    isPending: isSendUserOpPending,
    error: sendUserOpError,
  } = useSendUserOpMutation()

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
    isLoadingCoins || isSendAccountLoading || isEncodeRouteLoading || isLoadingUserOp

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
    if (!userOp) {
      return
    }

    if (__DEV__ || baseMainnet.id === 84532) {
      userOp.callGasLimit = userOp.callGasLimit * 3n
      userOp.preVerificationGas = userOp.preVerificationGas * 2n
    }

    try {
      await sendUserOpMutateAsync({
        userOp,
        webauthnCreds,
      })

      await Promise.all([
        tokensQuery.refetch(),
        ethQuery.refetch(),
        queryClient.refetchQueries({ queryKey: [useLiquidityPools.queryKey] }),
        queryClient.refetchQueries({ queryKey: [useSwapRouters.queryKey] }),
        queryClient.invalidateQueries({ queryKey: ['token_activity_feed', outCoin?.token] }),
      ])

      router.push(`/?token=${outCoin?.token}`)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!routeSummary) {
      router.push({ pathname: '/swap', query: swapParams })
    }

    if (encodeRouteStatus === 'idle') {
      void encodeRoute()
    }
  }, [routeSummary, swapParams, router.push, encodeRoute, encodeRouteStatus])

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
          <YStack gap={'$5'} position={'relative'}>
            <FadeCard>
              <XStack ai={'center'} jc={'space-between'}>
                <XStack gap={'$2'} ai={'center'}>
                  <IconCoin symbol={inCoin?.symbol || ''} />
                  <Paragraph testID={'inTokenSymbol'} size={'$5'}>
                    {inCoin?.symbol}
                  </Paragraph>
                </XStack>
                <EditButton />
              </XStack>
              <Paragraph
                testID={'swapInAmount'}
                width={'100%'}
                ff={'$mono'}
                whiteSpace={'nowrap'}
                overflow={'hidden'}
                textOverflow={'ellipsis'}
                size={(() => {
                  switch (true) {
                    case amountIn?.length > 16:
                      return '$7'
                    case amountIn?.length > 8:
                      return '$8'
                    default:
                      return '$9'
                  }
                })()}
                $gtSm={{ size: '$9' }}
              >
                {amountIn}
              </Paragraph>
            </FadeCard>
            <FadeCard>
              <XStack ai={'center'} jc={'space-between'}>
                <XStack gap={'$2'} ai={'center'}>
                  <IconCoin symbol={outCoin?.symbol || ''} />
                  <Paragraph testID={'outTokenSymbol'} size={'$5'}>
                    {outCoin?.symbol}
                  </Paragraph>
                </XStack>
                <EditButton />
              </XStack>
              <Paragraph
                testID={'swapOutAmount'}
                width={'100%'}
                ff={'$mono'}
                whiteSpace={'nowrap'}
                overflow={'hidden'}
                textOverflow={'ellipsis'}
                size={(() => {
                  switch (true) {
                    case amountOut?.length > 16:
                      return '$7'
                    case amountOut?.length > 8:
                      return '$8'
                    default:
                      return '$9'
                  }
                })()}
                $gtSm={{ size: '$9' }}
              >
                {amountOut}
              </Paragraph>
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
                testID={'exchangeRate'}
                label={'Exchange Rate'}
                value={`1 ${inCoin?.symbol} = ${exchangeRate} ${outCoin?.symbol}`}
              />
              <Row
                label={'Transaction Fee'}
                value={(() => {
                  switch (true) {
                    case isLoadingUSDCFees:
                      return <Spinner size="small" color="$color12" />
                    case !!usdcFeesError || !usdcFees:
                      return '-'
                    default:
                      return `${formatAmount(formatUnits(gas, usdcFees.decimals))} USDC`
                  }
                })()}
              />
              <Row label={'Send Fee'} value={'0.75%'} />
              <Row
                testID={'slippage'}
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
              case !!sendUserOpError:
                return sendUserOpError?.message?.split('.').at(0)
              default:
                return ''
            }
          })()}
        </Paragraph>
      </YStack>
      <Button
        theme={
          (!hasEnoughGas || !hasEnoughBalance) &&
          !isEncodeRouteLoading &&
          !isLoadingUserOp &&
          !encodeRouteError &&
          !userOpError
            ? 'red_alt1'
            : 'green'
        }
        onPress={submit}
        py={'$5'}
        br={'$4'}
        disabledStyle={{ opacity: 0.5 }}
        disabled={!canSubmit}
      >
        {(() => {
          switch (true) {
            case !hasEnoughBalance &&
              !isEncodeRouteLoading &&
              !isLoadingUserOp &&
              !encodeRouteError &&
              !userOpError:
              return (
                <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
                  insufficient balance
                </Button.Text>
              )
            case !hasEnoughGas && !encodeRouteError && !userOpError:
              return (
                <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
                  insufficient gas
                </Button.Text>
              )
            case isSendUserOpPending:
              return (
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
                    swapping...
                  </Button.Text>
                </>
              )
            default:
              return (
                <Button.Text
                  ff={'$mono'}
                  fontWeight={'500'}
                  tt="uppercase"
                  size={'$5'}
                  color={'$black'}
                >
                  confirm swap
                </Button.Text>
              )
          }
        })()}
      </Button>
    </YStack>
  )
}

export const Row = ({
  label,
  value,
  testID,
}: {
  label: string
  value: ReactNode
  testID?: string
}) => {
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
        <Paragraph testID={testID} size={'$5'}>
          {value}
        </Paragraph>
      </XStack>
    </XStack>
  )
}

export const EditButton = () => {
  const router = useRouter()

  const handlePress = () => {
    router.back()
  }

  return (
    <Button
      transparent
      chromeless
      backgroundColor="transparent"
      hoverStyle={{ backgroundColor: 'transparent' }}
      pressStyle={{ backgroundColor: 'transparent' }}
      focusStyle={{ backgroundColor: 'transparent' }}
      p={0}
      bw={0}
      height={'auto'}
      onPress={handlePress}
    >
      <Button.Text size={'$5'} hoverStyle={{ color: '$primary' }}>
        edit
      </Button.Text>
    </Button>
  )
}
