import { useEffect, useState } from 'react'
import { YStack, Card, XStack, Paragraph, Input, Button } from '@my/ui'
import { ArrowUp, ArrowDown } from '@tamagui/lucide-icons'
import { IconSwap } from 'app/components/icons'
import { coins as tokens, type CoinWithBalance } from 'app/data/coins'
import formatAmount from 'app/utils/formatAmount'
import PopoverItem from './PopoverItem'
import { useCoins } from 'app/provider/coins'
import { useTokenPrice } from 'app/utils/coin-gecko'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { FormProvider, useForm } from 'react-hook-form'
import { useSwapToken } from 'app/utils/swap-token'

export type SwapFormFields = {
  sendAmount: string
  receiveAmount: string
  fromToken: CoinWithBalance & { contractAddress: string }
  toToken: CoinWithBalance & { contractAddress: string }
}

const calculateUsdValue = (basePrice: number, tokenAmount: string): string => {
  const value = basePrice * Number(tokenAmount)
  return value.toString()
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

  const form = useForm<SwapFormFields>({
    defaultValues: {
      sendAmount: '',
      receiveAmount: '',
      fromToken: coin,
      toToken: defaultToToken,
    },
  })

  const fromToken = form.watch('fromToken')
  const toToken = form.watch('toToken')
  const amount = form.watch('sendAmount')
  const receiveAmount = form.watch('receiveAmount')

  const { data } = useSwapToken({
    tokenIn: fromToken.contractAddress,
    tokenOut: toToken.contractAddress,
    amountIn: amount,
  })

  const { data: fromTokenMarketPrice } = useTokenPrice(fromToken?.coingeckoTokenId ?? '')
  const { data: toTokenMarketPrice } = useTokenPrice(toToken?.coingeckoTokenId ?? '')

  useEffect(() => {
    if (fromToken && !fromToken.contractAddress) {
      form.setValue('fromToken', {
        ...fromToken,
        contractAddress:
          tokens.find((t) => t.coingeckoTokenId === fromToken.coingeckoTokenId)?.token || '',
      })
    }

    if (toToken && !toToken.contractAddress) {
      form.setValue('toToken', {
        ...toToken,
        contractAddress:
          tokens.find((t) => t.coingeckoTokenId === toToken.coingeckoTokenId)?.token || '',
      })
    }
  }, [
    fromToken,
    fromToken.coingeckoTokenId,
    fromToken.contractAddress,
    toToken,
    toToken.coingeckoTokenId,
    toToken.contractAddress,
    form,
  ])

  useEffect(() => {
    if (!fromToken || !toToken) return

    const inputBaseMarketPrice = fromTokenMarketPrice?.[fromToken.coingeckoTokenId]?.usd || 0
    const outputBaseMarketPrice = toTokenMarketPrice?.[toToken.coingeckoTokenId]?.usd || 0

    if (amount && Number(amount) > 0 && data?.outputAmount) {
      const outputAmountInWei = BigInt(data.outputAmount)
      const fromTokenDecimals = fromToken.decimals
      const toTokenDecimals = toToken.decimals

      const receivedAmount = Number(outputAmountInWei) / 10 ** toTokenDecimals
      const normalizedAmount = receivedAmount * 10 ** fromTokenDecimals

      if (receiveAmount !== normalizedAmount.toFixed(6)) {
        form.setValue('receiveAmount', normalizedAmount.toFixed(6))
      }

      setInputUsdValue(calculateUsdValue(inputBaseMarketPrice, amount))
      setOutputUsdValue(calculateUsdValue(outputBaseMarketPrice, normalizedAmount.toString()))
    } else {
      if (form.getValues('receiveAmount') !== '') {
        form.setValue('receiveAmount', '')
      }
      setInputUsdValue(null)
      setOutputUsdValue(null)
    }
  }, [
    data,
    fromToken,
    toToken,
    fromTokenMarketPrice,
    toTokenMarketPrice,
    amount,
    receiveAmount,
    form.getValues,
    form.setValue,
  ])

  const handleSwap = () => {
    const fromToken = form.getValues('fromToken')
    const toToken = form.getValues('toToken')
    form.setValue('fromToken', toToken)
    form.setValue('toToken', fromToken)
  }

  const handleMaxPress = () => {
    if (!fromToken.balance || fromToken.balance === BigInt(0)) return
    const formattedBalance = formatAmount(Number(fromToken.balance) / 10 ** fromToken.decimals)
    form.setValue('sendAmount', formattedBalance, { shouldValidate: true, shouldDirty: true })
  }

  const handleTokenChange = (token: CoinWithBalance, isFrom: boolean) => {
    const contractAddress =
      tokens.find((t) => t.coingeckoTokenId === token.coingeckoTokenId)?.token || ''

    if (!contractAddress) {
      console.error(`Contract address not found for token: ${token.coingeckoTokenId}`)
    }

    const selectedToken = { ...token, contractAddress }

    if (isFrom) {
      // prevent selecting the same token for both fields
      if (selectedToken.token === toToken.token) {
        const newToToken = coins.find((item) => item.token !== selectedToken.token)
        const contractAddress =
          tokens.find((t) => t.coingeckoTokenId === newToToken?.coingeckoTokenId)?.token || ''
        if (newToToken) {
          form.setValue('toToken', {
            ...newToToken,
            contractAddress,
          })
        }
      }
      form.setValue('fromToken', selectedToken)
      setFromDropdownOpen(false)
    } else {
      if (selectedToken.token === fromToken.token) {
        const newFromToken = coins.find((item) => item.token !== selectedToken.token)
        const contractAddress =
          tokens.find((t) => t.coingeckoTokenId === newFromToken?.coingeckoTokenId)?.token || ''
        if (newFromToken) {
          form.setValue('fromToken', {
            ...newFromToken,
            contractAddress,
          })
        }
      }
      form.setValue('toToken', selectedToken)
      setToDropdownOpen(false)
    }
  }

  const onSubmit = (data: SwapFormFields) => {
    console.log({ data })
  }

  return (
    <FormProvider {...form}>
      <YStack position="relative" w="100%" gap="$4">
        <Card p="$4.5" w="100%" h={188} jc="space-between" borderRadius="$6" position="relative">
          <YStack gap="$3">
            <XStack jc="space-between" ai="center">
              <XStack ai="center" gap="$2">
                <ArrowUp size={14} />
                <Paragraph fontSize={14} fontWeight="500" color="$color12">
                  You pay
                </Paragraph>
              </XStack>
            </XStack>

            <XStack ai="center" position="relative" jc="space-between" w="100%">
              <Input
                {...sharedInputStyles}
                testID="send-amount-input"
                placeholder="0"
                value={form.watch('sendAmount')}
                onChangeText={(text) => form.setValue('sendAmount', text)}
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
                ${inputUsdValue || fromTokenMarketPrice?.[fromToken.coingeckoTokenId]?.usd || '0'}
              </Paragraph>
              <XStack ai="center" gap="$2">
                <Paragraph fontSize={14} color="$gray8">
                  {formatAmount((Number(fromToken.balance) / 10 ** fromToken.decimals).toString())}{' '}
                  {fromToken.label}
                </Paragraph>
                <Button
                  testID="max-button"
                  onPress={handleMaxPress}
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
            onPress={handleSwap}
          >
            <Button.Icon>
              <IconSwap size={'$1'} color="$green11Dark" />
            </Button.Icon>
          </Button>
        </YStack>

        <Card p="$4.5" w="100%" h={188} jc="space-between" borderRadius="$6" position="relative">
          <YStack gap="$3">
            <XStack jc="space-between" ai="center">
              <XStack ai="center" gap="$2">
                <ArrowDown size={14} />
                <Paragraph fontSize={14} fontWeight="500" color="$color12">
                  You Receive
                </Paragraph>
              </XStack>
            </XStack>
            <XStack ai="center" position="relative" jc="space-between" w="100%">
              <Input
                {...sharedInputStyles}
                testID="receive-amount-output"
                value={receiveAmount}
                disabled
                placeholder="0"
              />
              <PopoverItem
                testID="todropdown-button"
                isOpen={toDropdownOpen}
                onOpenChange={setToDropdownOpen}
                selectedToken={toToken}
                coins={coins.filter((item) => item.token !== fromToken.token)}
                onTokenChange={(token) => handleTokenChange(token, false)}
              />
            </XStack>
            <XStack jc="space-between" ai="center">
              <Paragraph fontSize={14} color="$gray8">
                ${outputUsdValue || toTokenMarketPrice?.[toToken.coingeckoTokenId]?.usd || '0'}
              </Paragraph>
            </XStack>
          </YStack>
        </Card>
      </YStack>

      <Button theme="green" py={'$5'} br={'$4'} onPress={form.handleSubmit(onSubmit)}>
        <Paragraph fontWeight={'600'}>SEND</Paragraph>
      </Button>
    </FormProvider>
  )
}

const sharedInputStyles = {
  placeholderTextColor: '$gray10Dark',
  fontSize: 34,
  fontWeight: '600' as '400' | '500' | '600',
  color: '$color12',
  borderWidth: 0,
  borderBottomWidth: 1,
  borderBottomColor: '$gray10Dark',
  borderRadius: 0,
  outlineStyle: 'none',
  hoverStyle: {
    borderBottomWidth: 1,
    borderBottomColor: '$gray10Dark',
  },
  focusStyle: {
    outlineWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '$green11Dark',
  },
  paddingLeft: 0,
  backgroundColor: 'transparent',
  flexGrow: 1,
  maxWidth: '100%',
  maxLength: 16,
}
