import { useCallback, useEffect, useState } from 'react'
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
import { IconSwap } from 'app/components/icons'
import { allCoinsDict, usdcCoin } from 'app/data/coins'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { useCoin, useCoins } from 'app/provider/coins'
import { FormProvider, useForm } from 'react-hook-form'
import { formatUnits } from 'viem'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { z } from 'zod'
import { api } from 'app/utils/api'
import { useSwapScreenParams } from 'app/routers/params'
import { useRouter } from 'solito/router'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useThemeSetting } from '@tamagui/next-theme'
import { useQueryClient } from '@tanstack/react-query'
import { DEFAULT_SLIPPAGE, SWAP_ROUTE_SUMMARY_QUERY_KEY } from 'app/features/swap/constants'

// todo mobile
// todo white

// TODO bug z pojawiającym sie tekstem po usunieciu

// TODO komponent wyboru tokena potrzebuje zmian,
//  1. nie widac na nim nie posiadanych tokenów co jest złe dla docelowego,
//  2. nie powinno być można tych samych ustawić,
//  3. jego wyglad sie zmienił,
//  4. czasem moneta sie zle pokazuje

const SwapFormSchema = z.object({
  outToken: formFields.coin,
  inToken: formFields.coin,
  outAmount: formFields.text,
  inAmount: formFields.text,
  slippage: formFields.number
    .min(0, 'Min slippage value is 0%')
    .max(2000, 'Max slippage value is 20%'),
})

export const SwapForm = () => {
  const form = useForm<z.infer<typeof SwapFormSchema>>()
  const router = useRouter()
  const [swapParams, setSwapParams] = useSwapScreenParams()
  const { isLoading: isLoadingCoins } = useCoins()
  const { outToken, inToken, inAmount, slippage } = swapParams
  const { coin: inCoin } = useCoin(inToken)
  const { coin: outCoin } = useCoin(outToken)
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const hoverStyles = useHoverStyles()
  const { resolvedTheme } = useThemeSetting()
  const queryClient = useQueryClient()

  const {
    data: swapRoute,
    error: swapRouteError,
    isFetching: isFetchingRoute,
  } = api.swap.fetchSwapRoute.useQuery(
    {
      tokenIn: inCoin?.token || '',
      tokenOut: outCoin?.token || '',
      amountIn: inAmount || '',
    },
    {
      enabled: Boolean(inCoin && outCoin && inAmount),
      refetchInterval: 20_000,
    }
  )

  const formOutAmount = form.watch('outAmount')
  const formInAmount = form.watch('inAmount')
  const formSlippage = form.watch('slippage')

  const parsedInAmount = BigInt(swapParams.inAmount ?? '0')
  const parsedSlippage = Number(slippage || 0)
  const inAmountUsd = formatAmount(swapRoute?.routeSummary.amountInUsd)
  const outAmountUsd = formatAmount(swapRoute?.routeSummary.amountOutUsd)
  const isDarkTheme = resolvedTheme?.startsWith('dark')

  const canSubmit =
    !isLoadingCoins &&
    !isFetchingRoute &&
    inCoin?.balance !== undefined &&
    inAmount !== undefined &&
    inCoin.balance >= parsedInAmount &&
    parsedInAmount > BigInt(0) &&
    swapRoute

  const insufficientAmount =
    inCoin?.balance !== undefined && inAmount !== undefined && parsedInAmount > inCoin?.balance

  const handleSubmit = () => {
    if (!canSubmit || !swapRoute) return

    queryClient.setQueryData([SWAP_ROUTE_SUMMARY_QUERY_KEY], swapRoute.routeSummary)
    router.push({ pathname: '/swap/summary', query: swapParams })
  }

  const handleFlipTokens = () => {
    const { inToken: _inToken, outToken: _outToken } = form.getValues()
    form.setValue('inToken', _outToken)
    form.setValue('outToken', _inToken)
  }

  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { inAmount, outToken, inToken, slippage } = values

        const sanitizedInAmount = sanitizeAmount(inAmount, allCoinsDict[inToken]?.decimals)

        setSwapParams(
          {
            ...swapParams,
            inAmount: sanitizedInAmount.toString(),
            inToken,
            outToken,
            slippage,
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

  const handleSlippageChange = useCallback(
    (value: number) => {
      form.clearErrors('slippage')
      form.setValue('slippage', value)
    },
    [form.clearErrors, form.setValue]
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

  // TODO
  useEffect(() => {
    if (!swapRoute) {
      return
    }

    form.setValue(
      'outAmount',
      localizeAmount(formatUnits(BigInt(swapRoute.routeSummary.amountOut), outCoin?.decimals || 0))
    )
  }, [swapRoute, outCoin?.decimals, form.setValue])

  useEffect(() => {
    queryClient.removeQueries({ queryKey: [SWAP_ROUTE_SUMMARY_QUERY_KEY] })
  }, [queryClient.removeQueries])

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
      <FormProvider {...form}>
        <SchemaForm
          form={form}
          schema={SwapFormSchema}
          onSubmit={handleSubmit}
          props={{
            inAmount: {
              fontSize: (() => {
                switch (true) {
                  case formInAmount?.length <= 8:
                    return '$11'
                  case formInAmount?.length > 16:
                    return '$7'
                  default:
                    return '$8'
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

                if (!amount) {
                  form.setValue('outAmount', '')
                }
              },
              onFocus: () => setIsInputFocused(true),
              onBlur: () => setIsInputFocused(false),
              fieldsetProps: {
                width: '65%',
              },
            },
            outAmount: {
              fontSize: (() => {
                switch (true) {
                  case formOutAmount?.length <= 8:
                    return '$11'
                  case formOutAmount?.length > 16:
                    return '$7'
                  default:
                    return '$8'
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
                width: '65%',
              },
              pointerEvents: 'none',
            },
          }}
          formProps={{
            footerProps: { pb: 0 },
            justifyContent: 'space-between',
            $gtSm: {
              maxWidth: '100%',
              justifyContent: 'space-between',
            },
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
          renderAfter={({ submit }) => (
            <SubmitButton
              theme="green"
              onPress={submit}
              py={'$5'}
              br={'$4'}
              disabledStyle={{ opacity: 0.5 }}
              disabled={!canSubmit}
            >
              <Button.Text
                ff={'$mono'}
                fontWeight={'500'}
                tt="uppercase"
                size={'$5'}
                color={'$black'}
              >
                review
              </Button.Text>
            </SubmitButton>
          )}
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
                      <XStack ai={'center'} position="relative" jc={'space-between'}>
                        {inAmount}
                        {inToken}
                        <XStack
                          position="absolute"
                          bottom={-8}
                          left={0}
                          right={0}
                          height={1}
                          backgroundColor={isInputFocused ? '$primary' : '$darkGrayTextField'}
                          $theme-light={{
                            backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                          }}
                        />
                      </XStack>
                      <XStack ai={'center'} jc={'space-between'}>
                        <Paragraph
                          size={'$5'}
                          color={'$lightGrayTextField'}
                          $theme-light={{ color: '$darkGrayTextField' }}
                        >
                          {inAmountUsd ? `$${inAmountUsd}` : '$0.00'}
                        </Paragraph>
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
                      <XStack ai={'center'} position="relative" jc={'space-between'}>
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
                            case isFetchingRoute:
                              return <Spinner color="$color11" />
                            case !outAmountUsd:
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  $0.00
                                </Paragraph>
                              )
                            default:
                              return (
                                <Paragraph
                                  size={'$5'}
                                  color={'$lightGrayTextField'}
                                  $theme-light={{ color: '$darkGrayTextField' }}
                                >
                                  ${outAmountUsd}
                                </Paragraph>
                              )
                          }
                        })()}
                      </XStack>
                    </FadeCard>
                    <YStack
                      bc={'$color0'}
                      position={'absolute'}
                      top={'50%'}
                      left={'50%'}
                      borderRadius={9999}
                      transform={'translate(-50%, -50%)'}
                    >
                      <Button
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
                <FadeCard>
                  <Slippage slippage={formSlippage} onChange={handleSlippageChange} />
                </FadeCard>
              </YStack>
              <Paragraph color="$error">
                {(() => {
                  switch (true) {
                    case !!form.formState.errors?.slippage:
                      return form.formState.errors.slippage.message
                    case !!swapRouteError:
                      return swapRouteError.message
                    default:
                      return ''
                  }
                })()}
              </Paragraph>
            </YStack>
          )}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}

const SLIPPAGE_OPTIONS = [5, 10, 50, 100, 200]

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
        <XStack ai={'center'} jc={'space-between'}>
          <XStack gap={'$2'}>
            {SLIPPAGE_OPTIONS.map((slippageOption) => (
              <Button
                key={`slippage-${slippageOption}`}
                onPress={() => handleOnPress(slippageOption)}
                hoverStyle={hoverStyles}
                bw={0}
                p={'$2'}
                w={'$6'}
                br={'$4'}
                bc={slippageOption === slippage ? hoverStyles.background : '$color1'}
              >
                <Button.Text>{slippageOption / 100}%</Button.Text>
              </Button>
            ))}
          </XStack>
          <XStack pos={'relative'}>
            <Input
              inputMode={'decimal'}
              bw={0}
              bc={hoverStyles.background}
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
              transform={'translateY(-50%)'}
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
