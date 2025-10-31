import { Button, FadeCard, Paragraph, PrimaryButton, Spinner, XStack, YStack } from '@my/ui'
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
import { type ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useRouter } from 'solito/router'
import { useQueryClient } from '@tanstack/react-query'
import { DEFAULT_SLIPPAGE, SWAP_ROUTE_SUMMARY_QUERY_KEY } from 'app/features/swap/constants'
import { getPriceImpactAnalysis, getPriceImpactColor } from 'app/features/swap/utils/priceImpact'
import { baseMainnet } from '@my/wagmi'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { toNiceError } from 'app/utils/toNiceError'
import { Platform } from 'react-native'
import { useDidUserSwap } from 'app/features/swap/hooks/useDidUserSwap'
import { useThemeSetting } from '@tamagui/next-theme'
import { useUser } from 'app/utils/useUser'

export const SwapSummaryScreen = () => {
  const router = useRouter()
  const [swapParams] = useSwapScreenParams()
  const { isLoading: isLoadingCoins } = useCoins()
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const { outToken, inToken, inAmount, slippage } = swapParams
  const { coin: outCoin } = useCoin(outToken)
  const { coin: inCoin } = useCoin(inToken)
  const { coin: usdc } = useCoin('USDC')
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { tokensQuery, ethQuery } = useCoinFromSendTokenParam()
  const queryClient = useQueryClient()
  const { distributionShares } = useUser()

  // Compute if user is verified
  const isVerified = useMemo(
    () => Boolean(distributionShares[0] && distributionShares[0].amount > 0n),
    [distributionShares]
  )

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
    formatAmount(
      formatUnits(BigInt(routeSummary?.amountOut || 0), outCoin?.decimals || 0),
      12,
      outCoin?.formatDecimals
    )
  )

  const exchangeRate = formatAmount(
    Number(amountOut.replace(/,/g, '')) / Number(amountIn.replace(/,/g, '')),
    12,
    outCoin?.formatDecimals
  )

  const priceImpact = getPriceImpactAnalysis(routeSummary)

  // Calculate fee percentage from routeSummary
  const feePercentage = useMemo(() => {
    if (!routeSummary?.extraFee?.feeAmount) return isVerified ? '0.60' : '0.75'
    const feeBps = Number(routeSummary.extraFee.feeAmount)
    return (feeBps / 100).toFixed(2)
  }, [routeSummary?.extraFee?.feeAmount, isVerified])

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
  }, [sendAccount, routeSummary, encodeRouteMutateAsync, slippage])

  const submit = async () => {
    if (!userOp) {
      return
    }

    if (__DEV__ || baseMainnet.id === 84532) {
      userOp.callGasLimit = userOp.callGasLimit * 3n
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
        queryClient.invalidateQueries({ queryKey: [useDidUserSwap.queryKey] }),
      ])

      if (Platform.OS === 'web') {
        router.push(`/?token=${outCoin?.token}`)
        return
      }

      router.back()
      router.back()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!routeSummary) {
      router.push({ pathname: '/trade', query: swapParams })
    }

    if (encodeRouteStatus === 'idle') {
      void encodeRoute()
    }
  }, [routeSummary, swapParams, router, encodeRoute, encodeRouteStatus])

  if (initLoading) {
    return <Spinner size="large" color={'$color12'} />
  }

  return (
    <YStack
      f={Platform.OS === 'web' ? undefined : 1}
      w={'100%'}
      gap="$5"
      jc={'space-between'}
      $gtLg={{
        w: '50%',
        pb: '$3.5',
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
              position={'absolute'}
              top={0}
              left={0}
              right={0}
              bottom={0}
              justifyContent="center"
              alignItems="center"
              pointerEvents="none" // Prevent blocking interactions
            >
              <YStack bc={'$color0'} borderRadius={9999} p={'$3.5'}>
                <ArrowDown size={'$1'} />
              </YStack>
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
              <Row
                label={'Send Fee'}
                value={
                  <Paragraph
                    size={'$5'}
                    color={isVerified ? '$primary' : '$color12'}
                    $theme-light={{ color: isVerified ? '$olive' : '$color12' }}
                  >
                    {feePercentage}%
                  </Paragraph>
                }
              />
              {priceImpact && (
                <Row
                  testID={'priceImpact'}
                  label={'Price Impact'}
                  value={
                    <Paragraph
                      size={'$5'}
                      color={getPriceImpactColor(priceImpact.level, isDarkTheme)}
                    >
                      {priceImpact.formatted}
                    </Paragraph>
                  }
                />
              )}
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
                return toNiceError(encodeRouteError)
              case !!userOpError:
                return toNiceError(userOpError)
              case !!usdcFeesError:
                return toNiceError(usdcFeesError)
              case !!sendUserOpError:
                return toNiceError(sendUserOpError)
              default:
                return ''
            }
          })()}
        </Paragraph>
      </YStack>
      <PrimaryButton
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
        disabled={!canSubmit}
      >
        {(() => {
          switch (true) {
            case !hasEnoughBalance &&
              !isEncodeRouteLoading &&
              !isLoadingUserOp &&
              !encodeRouteError &&
              !userOpError:
              return <PrimaryButton.Text>insufficient balance</PrimaryButton.Text>
            case !hasEnoughGas && !encodeRouteError && !userOpError:
              return <PrimaryButton.Text>insufficient gas</PrimaryButton.Text>
            case isSendUserOpPending:
              return (
                <>
                  <PrimaryButton.Icon>
                    <Spinner size="small" color="$color12" mr={'$2'} />
                  </PrimaryButton.Icon>
                  <PrimaryButton.Text>trading...</PrimaryButton.Text>
                </>
              )
            default:
              return <PrimaryButton.Text>confirm trade</PrimaryButton.Text>
          }
        })()}
      </PrimaryButton>
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
      br={0}
      height={'auto'}
      onPress={handlePress}
      padding={10} // This increases clickable area
      margin={-10} // This keeps layout visually unchanged
    >
      <Button.Text size={'$5'} hoverStyle={{ color: '$primary' }}>
        edit
      </Button.Text>
    </Button>
  )
}
