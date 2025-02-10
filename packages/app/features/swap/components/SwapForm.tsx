import { useEffect, useState } from 'react'
import { YStack, Card, XStack, Paragraph, Button, SubmitButton } from '@my/ui'
import { ArrowUp, ArrowDown } from '@tamagui/lucide-icons'
import { IconSwap } from 'app/components/icons'
import type { CoinWithBalance } from 'app/data/coins'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import PopoverItem from './PopoverItem'
import { useCoins } from 'app/provider/coins'
import { useTokenPrice } from 'app/utils/coin-gecko'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { FormProvider, useForm } from 'react-hook-form'
import { useSwapToken } from 'app/utils/swap-token'
import { formatUnits, parseUnits } from 'viem'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { z } from 'zod'
import SlippageSelector from './SlippageSelector'

const SwapFormSchema = z.object({
  sendAmount: formFields.text,
  receiveAmount: formFields.text,
})

const calculateUsdValue = (basePrice: number, tokenAmount: string): string => {
  const value = basePrice * Number.parseFloat(tokenAmount)
  return value.toFixed(6)
}

export default function SwapForm() {
  const { coin } = useCoinFromTokenParam()
  const { coins } = useCoins()
  const defaultToToken = (() => {
    if (!coin) return coins[1] // default to 2nd token
    const coinIndex = coins.findIndex((item) => item.symbol === coin.symbol)
    return coins[(coinIndex + 1) % coins.length]
  })()

  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [toDropdownOpen, setToDropdownOpen] = useState(false)
  const [inputUsdValue, setInputUsdValue] = useState<string | null>(null)
  const [outputUsdValue, setOutputUsdValue] = useState<string | null>(null)
  const [fromToken, setFromToken] = useState<CoinWithBalance | undefined>(coin)
  const [toToken, setToToken] = useState<CoinWithBalance | undefined>(defaultToToken)
  const [slippage, setSlippage] = useState(0.5)

  const [isInputFocus, setInputFocus] = useState(false)

  const form = useForm<z.infer<typeof SwapFormSchema>>({
    defaultValues: {
      sendAmount: '',
      receiveAmount: '',
    },
  })

  const amount = form.watch('sendAmount')
  const receiveAmount = form.watch('receiveAmount')
  const sanitizedAmount = amount.replace(/,/g, '').trim()
  const parsedAmount = sanitizedAmount === '' ? BigInt(0) : BigInt(sanitizedAmount)
  const insufficientAmount = coin?.balance !== undefined && parsedAmount > coin?.balance

  const { data } = useSwapToken({
    tokenIn: fromToken?.token,
    tokenOut: toToken?.token,
    amountIn: sanitizedAmount,
  })

  const { data: fromTokenMarketPrice } = useTokenPrice(fromToken?.coingeckoTokenId ?? '')
  const { data: toTokenMarketPrice } = useTokenPrice(toToken?.coingeckoTokenId ?? '')

  // Calculates and updates the received amount and USD values based on the latest swap data
  useEffect(() => {
    if (!fromToken || !toToken) {
      setInputUsdValue(null)
      setOutputUsdValue(null)
      form.setValue('receiveAmount', '', { shouldValidate: true })
      return
    }

    const inputBaseMarketPrice = fromTokenMarketPrice?.[fromToken?.coingeckoTokenId ?? '']?.usd || 0
    const outputBaseMarketPrice = toTokenMarketPrice?.[toToken?.coingeckoTokenId ?? '']?.usd || 0

    if (!data?.outputAmount || !sanitizedAmount || Number(sanitizedAmount) === 0) {
      setInputUsdValue(null)
      setOutputUsdValue(null)
      form.setValue('receiveAmount', '', { shouldValidate: true })
      return
    }

    const outputAmountRaw = BigInt(data.outputAmount)
    const inputAmountRaw = Number(sanitizedAmount)

    const outputTokenDecimals = toToken.decimals
    const inputTokenDecimals = fromToken.decimals

    const outputAmountNormalized = Number(formatUnits(outputAmountRaw, outputTokenDecimals)) // outputAmount / 10^outputTokenDecimals
    const inputAmountNormalized = Number(parseUnits(inputAmountRaw.toString(), inputTokenDecimals)) // inputAmount / 10^inputTokenDecimals
    const exchangeRate = outputAmountNormalized / inputAmountNormalized

    const totalOutputTokens = exchangeRate * inputAmountRaw
    const normalizedAmount = totalOutputTokens.toFixed(6)

    if (form.getValues('receiveAmount') !== normalizedAmount) {
      form.setValue('receiveAmount', normalizedAmount, { shouldValidate: true })
    }

    setInputUsdValue(calculateUsdValue(inputBaseMarketPrice, sanitizedAmount))
    setOutputUsdValue(calculateUsdValue(outputBaseMarketPrice, normalizedAmount))
  }, [
    data?.outputAmount,
    fromToken,
    fromToken?.coingeckoTokenId,
    fromTokenMarketPrice,
    toToken,
    toToken?.coingeckoTokenId,
    toTokenMarketPrice,
    toToken?.decimals,
    sanitizedAmount,
    form.setValue,
    form.getValues,
  ])

  const switchFromTo = () => {
    setFromToken(toToken)
    setToToken(fromToken)
  }

  const maxoutBalance = () => {
    if (!fromToken || !fromToken.balance || fromToken.balance === BigInt(0)) return
    const formattedBalance = formatAmount(formatUnits(fromToken.balance, fromToken.decimals))
    form.setValue('sendAmount', formattedBalance, { shouldValidate: true, shouldDirty: true })
  }

  const handleTokenChange = (token: CoinWithBalance, isFrom: boolean) => {
    if (isFrom) {
      // Prevent selecting the same token in both fields
      if (token.token === toToken?.token) {
        const newToToken = coins.find((item) => item.token !== token.token)
        setToToken(newToToken)
      }
      setFromToken(token)
      setFromDropdownOpen(false)
    } else {
      if (token.token === fromToken?.token) {
        const newFromToken = coins.find((item) => item.token !== token.token)
        setFromToken(newFromToken)
      }
      setToToken(token)
      setToDropdownOpen(false)
    }
  }

  const onSubmit = async () => {
    console.log('submit')
  }

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        schema={SwapFormSchema}
        onSubmit={onSubmit}
        props={{
          sendAmount: {
            testID: 'send-amount-input',
            fontSize: (() => {
              switch (true) {
                case amount?.length <= 8:
                  return '$11'
                case amount?.length > 16:
                  return '$7'
                default:
                  return '$8'
              }
            })(),
            $gtSm: {
              fontSize: (() => {
                switch (true) {
                  case amount?.length <= 9:
                    return '$10'
                  case amount?.length > 16:
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
            inputMode: coin?.decimals ? 'decimal' : 'numeric',
            onChangeText: (amount) => {
              const localizedAmount = localizeAmount(amount)
              form.setValue('sendAmount', localizedAmount)
            },
            onFocus: () => setInputFocus(true),
            onBlur: () => setInputFocus(false),
            fieldsetProps: {
              width: '60%',
            },
          },
          receiveAmount: {
            testID: 'receive-amount-output',
            disabled: true,
            fontSize: (() => {
              switch (true) {
                case amount?.length <= 8:
                  return '$11'
                case amount?.length > 16:
                  return '$7'
                default:
                  return '$8'
              }
            })(),
            $gtSm: {
              fontSize: (() => {
                switch (true) {
                  case amount?.length <= 9:
                    return '$10'
                  case amount?.length > 16:
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
            defaultValue: receiveAmount,
          },
        }}
        formProps={{
          testID: 'SendForm',
          justifyContent: 'space-between',
          $gtSm: {
            maxWidth: '100%',
            justifyContent: 'space-between',
          },
        }}
        renderAfter={({ submit }) => (
          <SubmitButton theme="green" py={'$5'} br={'$4'} disabledStyle={{ opacity: 0.5 }}>
            <Button.Text fontWeight={'600'}>SWAP</Button.Text>
          </SubmitButton>
        )}
      >
        {({ sendAmount, receiveAmount }) => (
          <YStack gap="$3">
            <YStack gap="$5">
              <Card p="$4.5" w="100%" h={188} borderRadius="$6">
                <YStack gap="$3">
                  <XStack jc="space-between" ai="center">
                    <XStack w="100%" jc="space-between">
                      <XStack ai="center" gap="$2">
                        <ArrowUp size={14} />
                        <Paragraph fontSize={14} fontWeight="500" color="$color12">
                          You Pay
                        </Paragraph>
                      </XStack>
                      {insufficientAmount && (
                        <Paragraph color={'$error'} size={'$5'}>
                          Insufficient funds
                        </Paragraph>
                      )}
                    </XStack>
                  </XStack>
                  <XStack ai="center" jc="space-between">
                    {sendAmount}
                    <XStack
                      position="absolute"
                      bottom={-8}
                      left={0}
                      right={0}
                      height={1}
                      backgroundColor={isInputFocus ? '$primary' : '$silverChalice'}
                      $theme-light={{
                        backgroundColor: isInputFocus ? '$color12' : '$silverChalice',
                      }}
                    />
                    <PopoverItem
                      testID="fromdropdown-button"
                      isOpen={fromDropdownOpen}
                      onOpenChange={setFromDropdownOpen}
                      selectedToken={fromToken}
                      coins={coins}
                      onTokenChange={(token) => handleTokenChange(token, true)}
                    />
                  </XStack>
                  <XStack jc="space-between" ai="center">
                    <Paragraph fontSize={14} color="$gray8">
                      $
                      {inputUsdValue ||
                        fromTokenMarketPrice?.[fromToken?.coingeckoTokenId ?? '']?.usd ||
                        '0'}
                    </Paragraph>
                    <XStack ai="center" gap="$2">
                      <Paragraph fontSize={14} color="$gray8">
                        {fromToken
                          ? formatAmount(
                              formatUnits(fromToken.balance ?? BigInt(0), fromToken.decimals)
                            )
                          : '0'}{' '}
                        {fromToken?.label ?? ''}
                      </Paragraph>
                      <Button
                        testID="max-button"
                        onPress={maxoutBalance}
                        chromeless
                        p={0}
                        backgroundColor="transparent"
                        borderWidth={0}
                        hoverStyle={{ backgroundColor: 'transparent' }}
                      >
                        <Paragraph color="$green5" fontWeight="600">
                          MAX
                        </Paragraph>
                      </Button>
                    </XStack>
                  </XStack>
                </YStack>
              </Card>

              <YStack
                position="absolute"
                top="50%"
                left="50%"
                zIndex={2}
                transform="translate(-50%, -50%)"
              >
                <Button
                  testID="swap-button"
                  size="$5"
                  circular
                  w={60}
                  h={60}
                  elevate
                  $theme-dark={{ bc: '$darkest' }}
                  br="$10"
                  onPress={switchFromTo}
                >
                  <Button.Icon>
                    <IconSwap size={'$1'} color="$green11Dark" />
                  </Button.Icon>
                </Button>
              </YStack>

              <Card p="$4.5" w="100%" h={188} borderRadius="$6">
                <YStack gap="$3">
                  <XStack jc="space-between" ai="center">
                    <XStack ai="center" gap="$2">
                      <ArrowDown size={14} />
                      <Paragraph fontSize={14} fontWeight="500" color="$color12">
                        You Receive
                      </Paragraph>
                    </XStack>
                  </XStack>
                  <XStack ai="center" jc="space-between">
                    {receiveAmount}
                    <XStack
                      position="absolute"
                      bottom={-8}
                      left={0}
                      right={0}
                      height={1}
                      backgroundColor={'$silverChalice'}
                      $theme-light={{
                        backgroundColor: '$silverChalice',
                      }}
                    />
                    <PopoverItem
                      testID="todropdown-button"
                      isOpen={toDropdownOpen}
                      onOpenChange={setToDropdownOpen}
                      selectedToken={toToken}
                      coins={coins.filter((c) => c.token !== fromToken?.token)}
                      onTokenChange={(token) => handleTokenChange(token, false)}
                    />
                  </XStack>
                  <Paragraph fontSize={14} color="$gray8">
                    $
                    {outputUsdValue ||
                      toTokenMarketPrice?.[toToken?.coingeckoTokenId ?? '']?.usd ||
                      '0'}
                  </Paragraph>
                </YStack>
              </Card>
            </YStack>
            <SlippageSelector value={slippage} onSlippageChange={setSlippage} />
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
