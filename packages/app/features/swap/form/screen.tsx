import {
  Button,
  FadeCard,
  Input,
  Paragraph,
  Spinner,
  Stack,
  SubmitButton,
  useDebounce,
  XStack,
  YStack,
} from '@my/ui'
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useThemeSetting } from '@tamagui/next-theme'
import { useQueryClient } from '@tanstack/react-query'
import { IconSwap } from 'app/components/icons'
import { allCoinsDict, usdcCoin } from 'app/data/coins'
import { DEFAULT_SLIPPAGE, SWAP_ROUTE_SUMMARY_QUERY_KEY } from 'app/features/swap/constants'
import SwapRiskDialog from 'app/features/swap/form/RiskDialog/SwapRiskDialog'
import { useCoin, useCoins } from 'app/provider/coins'
import { useSwapScreenParams } from 'app/routers/params'
import { api } from 'app/utils/api'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import { type BRAND, z } from 'zod'
import { Platform } from 'react-native'

const SwapFormSchema = z.object({
  outToken: formFields.coin,
  inToken: formFields.coin,
  outAmount: formFields.text,
  inAmount: formFields.text,
  slippage: formFields.number
    .min(0, 'Min slippage value is 0%')
    .max(2000, 'Max slippage value is 20%'),
})

export const SwapFormScreen = () => {
  const form = useForm<z.infer<typeof SwapFormSchema>>()
  const router = useRouter()
  const [swapParams, setSwapParams] = useSwapScreenParams()
  const { isLoading: isLoadingCoins } = useCoins()
  const { outToken, inToken, inAmount, slippage } = swapParams
  const { coin: inCoin } = useCoin(inToken)
  const { coin: outCoin } = useCoin(outToken)
  const hoverStyles = useHoverStyles()
  const { resolvedTheme } = useThemeSetting()
  const queryClient = useQueryClient()

  // Track which side the user is editing
  const [quoteSide, setQuoteSide] = useState<'EXACT_IN' | 'EXACT_OUT'>('EXACT_IN')

  const sanitizedOutWei =
    outCoin && form.getValues().outAmount
      ? sanitizeAmount(form.getValues().outAmount, outCoin.decimals)?.toString()
      : undefined

  // Debounce outAmount (sanitized) before driving EXACT_OUT queries
  const [debouncedOutWei, setDebouncedOutWei] = useState<string | undefined>(undefined)
  const updateDebouncedOutWei = useDebounce(
    useCallback((value?: string) => {
      setDebouncedOutWei(value && value.length > 0 ? value : undefined)
    }, []),
    300,
    { leading: false },
    []
  )
  useEffect(() => {
    if (quoteSide === 'EXACT_OUT') {
      updateDebouncedOutWei(sanitizedOutWei)
    } else {
      // cancel and clear when not editing outAmount
      updateDebouncedOutWei.cancel?.()
      setDebouncedOutWei(undefined)
    }
  }, [quoteSide, sanitizedOutWei, updateDebouncedOutWei])

  // Compute per-direction inputs
  const amountOutForQuery = quoteSide === 'EXACT_OUT' ? debouncedOutWei || '' : ''

  const formOutAmount = form.watch('outAmount')
  const formInAmount = form.watch('inAmount')
  const formSlippage = form.watch('slippage')

  const parsedInAmount = BigInt(swapParams.inAmount ?? '0')
  const parsedSlippage = Number(slippage || 0)

  const {
    data: estimate,
    error: estimateError,
    isFetching: isEstimating,
  } = api.swap.estimateAmountInFromAmountOut.useQuery(
    {
      tokenIn: inCoin?.token || '',
      tokenOut: outCoin?.token || '',
      amountOut: amountOutForQuery || '',
    },
    {
      enabled: Boolean(inCoin && outCoin && quoteSide === 'EXACT_OUT' && amountOutForQuery),
      staleTime: 10_000,
    }
  )

  const {
    data: swapRoute,
    isFetching: isFetchingSwap,
    refetch: refetchSwap,
  } = api.swap.fetchSwapRoute.useQuery(
    {
      tokenIn: inCoin?.token || '',
      tokenOut: outCoin?.token || '',
      amountIn: inAmount || '',
    },
    {
      enabled: Boolean(quoteSide === 'EXACT_IN' && inCoin && outCoin && inAmount),
      refetchInterval: 20_000,
    }
  )

  const displaySummary = swapRoute?.routeSummary
  const inAmountUsd = formatAmount(
    quoteSide === 'EXACT_OUT' ? estimate?.amountInUsd : displaySummary?.amountInUsd
  )
  const outAmountUsd = formatAmount(
    quoteSide === 'EXACT_OUT' ? estimate?.amountOutUsd : displaySummary?.amountOutUsd
  )
  const isDarkTheme = resolvedTheme?.startsWith('dark')

  const canSubmit =
    !isLoadingCoins &&
    !(
      (quoteSide === 'EXACT_IN' && isFetchingSwap) ||
      (quoteSide === 'EXACT_OUT' && isEstimating)
    ) &&
    inCoin?.balance !== undefined &&
    inAmount !== undefined &&
    inCoin.balance >= parsedInAmount &&
    parsedInAmount > BigInt(0)

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <SubmitButton
        onPress={submit}
        disabled={!canSubmit || (quoteSide === 'EXACT_IN' ? isFetchingSwap : isEstimating)}
      >
        {(quoteSide === 'EXACT_IN' ? isFetchingSwap : isEstimating) ? (
          <>
            <Spinner size="small" color="$color12" mr={'$2'} />
            <SubmitButton.Text>loading</SubmitButton.Text>
          </>
        ) : (
          <SubmitButton.Text>review</SubmitButton.Text>
        )}
      </SubmitButton>
    ),
    [canSubmit, isFetchingSwap, isEstimating, quoteSide]
  )

  const insufficientAmount =
    inCoin?.balance !== undefined && inAmount !== undefined && parsedInAmount > inCoin?.balance

  const handleSubmit = async () => {
    if (!canSubmit) return
    if (!inCoin || !outCoin || !swapParams.inAmount) return

    // Always refetch to ensure the freshest swap route on submit
    const res = await refetchSwap()
    const routeSummary = res.data?.routeSummary || null
    if (!routeSummary) return

    queryClient.setQueryData([SWAP_ROUTE_SUMMARY_QUERY_KEY], routeSummary)

    router.push({
      pathname: '/trade/summary',
      query: {
        inToken: swapParams.inToken,
        outToken: swapParams.outToken,
        inAmount: swapParams.inAmount,
        slippage: swapParams.slippage,
      },
    })
  }

  const handleFlipTokens = () => {
    const { inToken: _inToken, outToken: _outToken, outAmount: _outAmount } = form.getValues()

    // Move out -> in
    form.setValue('inToken', _outToken)
    form.setValue('inAmount', _outAmount || '')

    // Move in -> out (clear amount to avoid showing stale value while route loads)
    form.setValue('outToken', _inToken)
    form.setValue('outAmount', '')

    // After flip, drive quoting from inAmount (EXACT_IN) so outAmount recomputes
    setQuoteSide('EXACT_IN')
  }

  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { inAmount, outToken, inToken, slippage } = values
        const sanitizedInAmount = sanitizeAmount(inAmount, allCoinsDict[inToken]?.decimals)
        const nextInWei = sanitizedInAmount ? sanitizedInAmount.toString() : undefined

        // For EXACT_OUT, avoid writing inAmount here to prevent duplicate fetches.
        const nextInWeiToWrite = quoteSide === 'EXACT_OUT' ? swapParams.inAmount : nextInWei

        // Only write URL params when they actually change to avoid router thrash
        if (
          nextInWeiToWrite !== swapParams.inAmount ||
          inToken !== swapParams.inToken ||
          outToken !== swapParams.outToken ||
          slippage !== swapParams.slippage
        ) {
          setSwapParams(
            {
              ...swapParams,
              inAmount: nextInWeiToWrite,
              inToken,
              outToken,
              slippage,
            },
            { webBehavior: 'replace' }
          )
        }
      },
      [swapParams, setSwapParams, quoteSide]
    ),
    300,
    { leading: false },
    []
  )

  const handleSlippageChange = useCallback(
    (value: number) => {
      form.clearErrors('slippage')
      form.setValue('slippage', value)
    },
    [form.clearErrors, form.setValue]
  )

  // Debounced writer for EXACT_OUT URL param updates
  const writeExactOutParams = useDebounce(
    useCallback(
      (payload: {
        inWei: string
        inToken: `0x${string}` | 'eth'
        outToken: `0x${string}` | 'eth'
        slippage: number
      }) => {
        const { inWei, inToken: inTok, outToken: outTok, slippage: sl } = payload
        setSwapParams(
          {
            ...swapParams,
            inAmount: inWei,
            inToken: inTok,
            outToken: outTok,
            slippage: String(sl),
          },
          { webBehavior: 'replace' }
        )
      },
      [swapParams, setSwapParams]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    const subscription = form.watch((values) => {
      onFormChange(values)
    })

    return () => {
      subscription.unsubscribe()
      onFormChange.cancel()
    }
  }, [form.watch, onFormChange])

  // When editing inAmount, derive outAmount from swap route (write only on change)
  useEffect(() => {
    if (quoteSide !== 'EXACT_IN') return
    if (!swapRoute || !formInAmount) return
    const nextOutDisplay = localizeAmount(
      formatAmount(
        formatUnits(BigInt(swapRoute.routeSummary.amountOut), outCoin?.decimals || 0),
        12,
        outCoin?.formatDecimals
      )
    )
    const prevOutDisplay = form.getValues().outAmount
    if (nextOutDisplay !== prevOutDisplay) {
      form.setValue('outAmount', nextOutDisplay)
    }
  }, [
    swapRoute,
    outCoin?.decimals,
    form.setValue,
    form.getValues,
    formInAmount,
    outCoin?.formatDecimals,
    quoteSide,
  ])

  // When editing outAmount, estimate required inAmount (server computed)
  useEffect(() => {
    if (quoteSide !== 'EXACT_OUT') return
    if (!estimate || !outCoin || !inCoin) return
    const inWei = BigInt(estimate.estimatedAmountIn || '0')
    const nextInDisplay = localizeAmount(
      formatAmount(formatUnits(inWei, inCoin.decimals || 0), 12, 2)
    )
    const prevInDisplay = form.getValues().inAmount
    const prevInWei = swapParams.inAmount
    if (nextInDisplay !== prevInDisplay) {
      form.setValue('inAmount', nextInDisplay)
    }
    // Only write URL params when actual wei changed (debounced)
    if (inWei.toString() !== prevInWei) {
      writeExactOutParams({
        inWei: inWei.toString(),
        inToken,
        outToken,
        slippage: Number(slippage || DEFAULT_SLIPPAGE),
      })
    }
  }, [
    estimate,
    outCoin,
    inCoin,
    form.setValue,
    form.getValues,
    quoteSide,
    writeExactOutParams,
    swapParams,
    inToken,
    outToken,
    slippage,
  ])

  useEffect(() => {
    queryClient.removeQueries({ queryKey: [SWAP_ROUTE_SUMMARY_QUERY_KEY] })
    return () => {
      // cancel debounced writer on unmount
      writeExactOutParams.cancel?.()
      updateDebouncedOutWei.cancel?.()
    }
  }, [queryClient.removeQueries, writeExactOutParams, updateDebouncedOutWei])

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
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={SwapFormSchema}
          onSubmit={handleSubmit}
          props={{
            inAmount: {
              testID: 'inAmountInput',
              fontSize: (() => {
                switch (true) {
                  case formInAmount?.length > 16:
                    return '$7'
                  case formInAmount?.length > 8:
                    return '$8'
                  default:
                    return '$9'
                }
              })(),
              $gtSm: {
                fontSize: (() => {
                  switch (true) {
                    case formInAmount?.length <= 9:
                      return '$10'
                    case formInAmount?.length > 16:
                      return '$8'
                    default:
                      return '$10'
                  }
                })(),
              },
              color: '$color12',
              fontWeight: '500',
              bw: 0,
              br: 0,
              p: 1,
              focusStyle: {
                outlineWidth: 0,
              },
              placeholder: '0',
              fontFamily: '$mono',
              '$theme-dark': {
                placeholderTextColor: '$darkGrayTextField',
              },
              '$theme-light': {
                placeholderTextColor: '$darkGrayTextField',
              },
              inputMode: inCoin?.decimals ? 'decimal' : 'numeric',
              onChangeText: (amount) => {
                const localizedInAmount = localizeAmount(amount)
                form.setValue('inAmount', localizedInAmount)
                setQuoteSide('EXACT_IN')
                if (!amount) {
                  form.setValue('outAmount', '')
                }
              },
              fieldsetProps: {
                width: '60%',
              },
            },
            outAmount: {
              testID: 'outAmountInput',
              fontSize: (() => {
                switch (true) {
                  case formOutAmount?.length > 16:
                    return '$7'
                  case formOutAmount?.length > 8:
                    return '$8'
                  default:
                    return '$9'
                }
              })(),
              $gtSm: {
                fontSize: (() => {
                  switch (true) {
                    case formOutAmount?.length <= 9:
                      return '$10'
                    case formOutAmount?.length > 16:
                      return '$8'
                    default:
                      return '$10'
                  }
                })(),
              },
              color: '$color12',
              fontWeight: '500',
              bw: 0,
              br: 0,
              p: 1,
              focusStyle: {
                outlineWidth: 0,
              },
              placeholder: '0',
              fontFamily: '$mono',
              '$theme-dark': {
                placeholderTextColor: '$darkGrayTextField',
              },
              '$theme-light': {
                placeholderTextColor: '$darkGrayTextField',
              },
              fieldsetProps: {
                width: '60%',
              },
              inputMode: outCoin?.decimals ? 'decimal' : 'numeric',
              onChangeText: (amount) => {
                const localizedOutAmount = localizeAmount(amount)
                form.setValue('outAmount', localizedOutAmount)
                setQuoteSide('EXACT_OUT')
                if (!amount) {
                  form.setValue('inAmount', '')
                }
              },
              textOverflow: 'ellipsis',
            },
            inToken: {
              defaultValue: inToken,
              showAllCoins: true,
              onValueChange: (value: string & BRAND<'coin'>) => {
                if (value === outToken) {
                  handleFlipTokens()
                  return
                }

                form.setValue('inToken', value)
              },
            },
            outToken: {
              defaultValue: outToken,
              showAllCoins: true,
              onValueChange: (value: string & BRAND<'coin'>) => {
                if (value === inToken) {
                  handleFlipTokens()
                  return
                }

                form.setValue('outToken', value)
              },
            },
          }}
          formProps={{
            footerProps: { p: 0 },
            $gtSm: {
              maxWidth: '100%',
            },
            style: { justifyContent: 'space-between' },
          }}
          defaultValues={{
            inToken: inCoin?.token,
            outToken: outCoin?.token,
            inAmount:
              inAmount && inCoin !== undefined
                ? localizeAmount(formatUnits(BigInt(inAmount), inCoin.decimals))
                : undefined,
            slippage: parsedSlippage || DEFAULT_SLIPPAGE,
          }}
          renderAfter={renderAfterContent}
        >
          {({ outToken, inToken, outAmount, inAmount }) => (
            <YStack gap="$3.5">
              <YStack gap="$5">
                <YStack gap="$5">
                  <YStack gap="$5" position={'relative'}>
                    <FadeCard borderColor={insufficientAmount ? '$error' : 'transparent'} bw={1}>
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
                      <XStack gap={'$2'} ai={'center'} position="relative" jc={'space-between'}>
                        {inAmount}
                        {inToken}
                        <XStack
                          position="absolute"
                          bottom={-8}
                          left={0}
                          right={0}
                          height={1}
                          backgroundColor={'$darkGrayTextField'}
                          $theme-light={{
                            backgroundColor: '$silverChalice',
                          }}
                        />
                      </XStack>
                      <XStack ai={'center'} jc={'space-between'}>
                        {(() => {
                          switch (true) {
                            case isLoadingCoins:
                              return <Spinner color="$color11" />
                            case !inCoin || !parsedInAmount:
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  $0
                                </Paragraph>
                              )
                            case inCoin?.symbol === 'USDC':
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  ${formInAmount}
                                </Paragraph>
                              )
                            default:
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  {inAmountUsd ? `$${inAmountUsd}` : '$0'}
                                </Paragraph>
                              )
                          }
                        })()}
                        <XStack gap={'$3.5'} ai={'center'}>
                          {(() => {
                            switch (true) {
                              case isLoadingCoins:
                                return <Spinner color="$color11" />
                              case !isLoadingCoins && !inCoin:
                                return (
                                  <Paragraph color="$error">Error fetching balance info</Paragraph>
                                )
                              case !inCoin?.balance:
                                return (
                                  <Paragraph size={'$5'} fontWeight={'500'}>
                                    -
                                  </Paragraph>
                                )
                              default:
                                return (
                                  <Paragraph
                                    size={'$5'}
                                    fontWeight={'400'}
                                    color={insufficientAmount ? '$error' : '$color12'}
                                  >
                                    {formatAmount(
                                      formatUnits(inCoin?.balance, inCoin?.decimals),
                                      12,
                                      inCoin?.formatDecimals
                                    )}{' '}
                                    {inCoin?.symbol}
                                  </Paragraph>
                                )
                            }
                          })()}
                          {inCoin !== undefined && inCoin.symbol !== usdcCoin.symbol && (
                            <Button
                              // @ts-expect-error tamagui is tripping here
                              type={'button'}
                              chromeless
                              backgroundColor={'transparent'}
                              hoverStyle={{ backgroundColor: 'transparent' }}
                              pressStyle={{ backgroundColor: 'transparent' }}
                              focusStyle={{ backgroundColor: 'transparent' }}
                              p={0}
                              bw={0}
                              height={'auto'}
                              onPress={() => {
                                form.setValue(
                                  'inAmount',
                                  localizeAmount(formatUnits(inCoin.balance ?? 0n, inCoin.decimals))
                                )
                              }}
                              $theme-light={{ borderBottomColor: '$color12' }}
                            >
                              <Button.Text
                                tt="uppercase"
                                color={
                                  inCoin.balance === parsedInAmount ? '$primary' : '$silverChalice'
                                }
                                size={'$5'}
                                textDecorationLine={'underline'}
                                hoverStyle={{
                                  color: isDarkTheme ? '$primary' : '$color12',
                                }}
                                $theme-light={{
                                  color:
                                    inCoin.balance === parsedInAmount
                                      ? '$color12'
                                      : '$darkGrayTextField',
                                }}
                              >
                                max
                              </Button.Text>
                            </Button>
                          )}
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
                      <XStack gap={'$2'} ai={'center'} position="relative" jc={'space-between'}>
                        {outAmount}
                        {outToken}
                        <XStack
                          position="absolute"
                          bottom={-8}
                          left={0}
                          right={0}
                          height={1}
                          backgroundColor={'$darkGrayTextField'}
                          $theme-light={{
                            backgroundColor: '$silverChalice',
                          }}
                        />
                      </XStack>
                      <XStack height={'$2'} ai={'center'}>
                        {(() => {
                          switch (true) {
                            case (quoteSide === 'EXACT_IN' ? isFetchingSwap : isEstimating) ||
                              isLoadingCoins:
                              return <Spinner color="$color11" />
                            case !outCoin || !outAmountUsd:
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  $0
                                </Paragraph>
                              )
                            case outCoin?.symbol === 'USDC':
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  {outAmountUsd ? `$${outAmountUsd}` : '$0'}
                                </Paragraph>
                              )
                            default:
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  {outAmountUsd ? `$${outAmountUsd}` : '$0'}
                                </Paragraph>
                              )
                          }
                        })()}
                      </XStack>
                    </FadeCard>
                    <YStack
                      position={'absolute'}
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      justifyContent="center"
                      alignItems="center"
                      style={{
                        pointerEvents: Platform.OS === 'web' ? 'none' : 'box-none',
                      }}
                    >
                      <YStack bc={'$color0'} borderRadius={9999} pointerEvents={'auto'}>
                        <Button
                          // @ts-expect-error tamagui is tripping here
                          type={'button'}
                          testID={'flipTokensButton'}
                          bc={'$color0'}
                          circular={true}
                          size={'$5'}
                          borderWidth={0}
                          hoverStyle={hoverStyles}
                          onPress={handleFlipTokens}
                        >
                          <Button.Icon>
                            <IconSwap size={'$1'} />
                          </Button.Icon>
                        </Button>
                      </YStack>
                    </YStack>
                  </YStack>
                </YStack>
                <FadeCard>
                  <Slippage slippage={formSlippage} onChange={handleSlippageChange} />
                </FadeCard>
              </YStack>
              <Paragraph color="$error">
                {(() => {
                  switch (true) {
                    case !!form.formState.errors?.slippage:
                      return form.formState.errors.slippage.message
                    case !!estimateError:
                      return estimateError.message
                    default:
                      return ''
                  }
                })()}
              </Paragraph>
            </YStack>
          )}
        </SchemaForm>
      </FormProvider>
      <SwapRiskDialog />
    </YStack>
  )
}

const SLIPPAGE_OPTIONS = [50, 100, 300]

export const Slippage = ({
  slippage,
  onChange,
}: {
  slippage: number
  onChange: (value: number) => void
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [customSlippage, setCustomSlippage] = useState<string | null>(null)
  const hoverStyles = useHoverStyles()

  const handleInputChange = (value: string) => {
    if (/^\d{0,2}(\.\d{0,2})?$/.test(value) || value === '') {
      setCustomSlippage(value)
      return
    }
  }

  const handleOnPress = (value: number) => {
    onChange(value)
    setCustomSlippage(null)
  }

  useEffect(() => {
    if (customSlippage === null) {
      return
    }

    if (customSlippage === '') {
      onChange(DEFAULT_SLIPPAGE)
      return
    }

    onChange(Number(customSlippage) * 100)
  }, [customSlippage, onChange])

  useEffect(() => {
    if (customSlippage === null && slippage !== undefined && !SLIPPAGE_OPTIONS.includes(slippage)) {
      setCustomSlippage((slippage / 100).toString())
    }
  }, [slippage, customSlippage])

  return (
    <YStack gap={'$3.5'}>
      <XStack ai={'center'} jc={'space-between'}>
        <Paragraph
          size={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Max Slippage
        </Paragraph>
        <XStack gap={'$2'}>
          <Paragraph size={'$5'}>{slippage / 100}%</Paragraph>
          <Button
            // @ts-expect-error tamagui is tripping here
            type={'button'}
            testID={'slippageDetailsButton'}
            chromeless
            backgroundColor={'transparent'}
            hoverStyle={{
              backgroundColor: 'transparent',
            }}
            pressStyle={{
              backgroundColor: 'transparent',
            }}
            focusStyle={{
              backgroundColor: 'transparent',
            }}
            p={0}
            bw={0}
            height={'auto'}
            onPress={() => setIsOpen((prevState) => !prevState)}
          >
            <Button.Icon>
              {isOpen ? (
                <ChevronUp size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />
              ) : (
                <ChevronDown size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />
              )}
            </Button.Icon>
          </Button>
        </XStack>
      </XStack>
      {isOpen && (
        <XStack gap={'$2'} columnGap={'$2'} flexWrap={'wrap'}>
          {SLIPPAGE_OPTIONS.map((slippageOption) => (
            <Button
              // @ts-expect-error tamagui is tripping here
              type={'button'}
              key={`slippage-${slippageOption}`}
              onPress={() => handleOnPress(slippageOption)}
              hoverStyle={hoverStyles}
              bw={0}
              p={'$2'}
              width={'$6'}
              br={'$4'}
              bc={slippageOption === slippage ? hoverStyles.backgroundColor : '$color1'}
            >
              <Button.Text>{slippageOption / 100}%</Button.Text>
            </Button>
          ))}
          <XStack pos={'relative'} $gtSm={{ marginLeft: 'auto' }}>
            <Input
              testID={'customSlippageInput'}
              inputMode={'decimal'}
              bw={0}
              bc={hoverStyles.backgroundColor}
              textAlign={'center'}
              focusStyle={{ outlineWidth: 0 }}
              w={100}
              br={'$4'}
              placeholder={isFocused ? '' : 'Custom'}
              $theme-dark={{
                placeholderTextColor: '$color12',
              }}
              $theme-light={{
                placeholderTextColor: '$color12',
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              value={customSlippage || ''}
              onChangeText={handleInputChange}
              p={'$2'}
              pr={'$4'}
            />
            <Stack
              pos={'absolute'}
              top="50%"
              p={'$3'}
              right={2}
              transform={'translateY(-22px)'}
              zIndex={1}
            >
              <Paragraph>%</Paragraph>
            </Stack>
          </XStack>
        </XStack>
      )}
    </YStack>
  )
}
