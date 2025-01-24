import { useState } from 'react'
import { Card, H3, Paragraph, YStack, Button, XStack, Popover, Input } from 'tamagui'
import { ArrowDown, ArrowUp, ChevronDown } from '@tamagui/lucide-icons'
import { IconSwap } from 'app/components/icons'
import { useForm, FormProvider } from 'react-hook-form'
import { TokenDetailsMarketData } from 'app/components/TokenDetailsMarketData'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useCoins } from 'app/provider/coins'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'
import formatAmount from 'app/utils/formatAmount'
import { useTokenPrice } from 'app/utils/coin-gecko'

type FormField = {
  sendAmount: string
  receiveAmount: string
  fromToken: CoinWithBalance
  toToken: CoinWithBalance
}

const TokenItem = ({ coin }: { coin: CoinWithBalance }) => {
  return (
    <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'}>
      <IconCoin symbol={coin.symbol} />
      <Paragraph fontSize={'$5'} fontWeight={'500'} textTransform={'uppercase'} color={'$color12'}>
        {coin.label}
      </Paragraph>
    </XStack>
  )
}

export function SwapScreen() {
  const { coin } = useCoinFromTokenParam()
  const { coins } = useCoins()
  const defaultToToken = coins.filter((item) => item.symbol === 'USDC')[0]

  const form = useForm<FormField>({
    defaultValues: {
      sendAmount: '',
      receiveAmount: '',
      fromToken: coin,
      toToken: defaultToToken,
    },
  })

  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [toDropdownOpen, setToDropdownOpen] = useState(false)

  const fromToken = form.watch('fromToken')
  const toToken = form.watch('toToken')

  const { data: fromTokenPrice } = useTokenPrice(fromToken.coingeckoTokenId)
  const { data: toTokenPrice } = useTokenPrice(toToken.coingeckoTokenId)

  const handleSwap = () => {
    const fromToken = form.getValues('fromToken')
    const toToken = form.getValues('toToken')
    form.setValue('fromToken', toToken)
    form.setValue('toToken', fromToken)
  }

  const handleMaxPress = () => {
    if (!fromToken.balance || fromToken.balance === BigInt(0)) return

    form.setValue('sendAmount', fromToken.balance.toString())
  }

  const handleFromTokenChange = (token: CoinWithBalance) => {
    form.setValue('fromToken', token)

    if (token.token === toToken.token) {
      const newToToken = coins.find((item) => item.token !== token.token)
      if (newToToken) form.setValue('toToken', newToToken)
    }

    setFromDropdownOpen(false)
  }

  return (
    <FormProvider {...form}>
      <YStack mt="$4" width="100%" $sm={{ maxWidth: 600 }} gap={50} maxWidth={511}>
        <YStack width="100%" gap={8}>
          <H3 fontWeight="400">Swap</H3>
          {coin && <TokenDetailsMarketData coin={coin} />}
        </YStack>

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
                  {...form.register('sendAmount')}
                  placeholder="0"
                  placeholderTextColor="$gray10Dark"
                  value={form.watch('sendAmount')}
                  onChangeText={(text) => form.setValue('sendAmount', text)}
                  fontSize={34}
                  fontWeight="600"
                  color="$color12"
                  borderWidth={0}
                  borderBottomWidth={1}
                  borderBottomColor="$gray10Dark"
                  borderRadius={0}
                  outlineStyle="none"
                  hoverStyle={{
                    borderBottomWidth: 1,
                    borderBottomColor: '$gray10Dark',
                  }}
                  focusStyle={{
                    outlineWidth: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '$green11Dark',
                  }}
                  paddingLeft={0}
                  backgroundColor="transparent"
                  flexGrow={1}
                  maxWidth="100%"
                  maxLength={16}
                />
                <Popover open={fromDropdownOpen} onOpenChange={setFromDropdownOpen}>
                  <Popover.Trigger asChild>
                    <Button
                      chromeless
                      size="$3"
                      position="absolute"
                      right={0}
                      p={0}
                      backgroundColor="transparent"
                      borderWidth={0}
                      hoverStyle={{ backgroundColor: 'transparent' }}
                    >
                      <TokenItem coin={fromToken} />
                      <ChevronDown size={16} color="$green5" />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content
                    p={0}
                    mt="$2"
                    bg="$color2"
                    br="$6"
                    elevate
                    width="100%"
                    overflow="hidden"
                  >
                    {coins?.map((token, id) => (
                      <XStack
                        key={token.token}
                        cursor="pointer"
                        jc="space-between"
                        ai="center"
                        py="$3"
                        px="$5"
                        w="100%"
                        onPress={() => handleFromTokenChange(token)}
                        hoverStyle={{ bg: '$color3' }}
                      >
                        <TokenItem coin={token} />
                      </XStack>
                    ))}
                  </Popover.Content>
                </Popover>
              </XStack>

              <XStack jc="space-between" ai="center">
                <Paragraph fontSize={14} color="$gray8">
                  ${fromTokenPrice?.[fromToken.coingeckoTokenId]?.usd ?? '0'}
                </Paragraph>
                <XStack ai="center" gap="$2">
                  <Paragraph fontSize={14} color="$gray8">
                    {formatAmount(
                      (Number(fromToken.balance) / 10 ** fromToken.decimals).toString(),
                      10,
                      5
                    )}{' '}
                    {fromToken.label}
                  </Paragraph>
                  <Button
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
                  placeholder="0"
                  placeholderTextColor="$gray10Dark"
                  value={form.watch('receiveAmount')}
                  disabled
                  fontSize={34}
                  fontWeight="600"
                  color="$color12"
                  borderWidth={0}
                  borderBottomWidth={1}
                  borderBottomColor="$gray10Dark"
                  borderRadius={0}
                  outlineStyle="none"
                  hoverStyle={{
                    borderBottomWidth: 1,
                    borderBottomColor: '$gray10Dark',
                  }}
                  focusStyle={{
                    outlineWidth: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '$green11Dark',
                  }}
                  paddingLeft={0}
                  backgroundColor="transparent"
                  flexGrow={1}
                  maxWidth="100%"
                  maxLength={16}
                />
                <Popover open={toDropdownOpen} onOpenChange={setToDropdownOpen}>
                  <Popover.Trigger asChild>
                    <Button
                      chromeless
                      size="$3"
                      position="absolute"
                      right={0}
                      p={0}
                      backgroundColor="transparent"
                      borderWidth={0}
                      hoverStyle={{ backgroundColor: 'transparent' }}
                    >
                      <TokenItem coin={toToken} />
                      <ChevronDown size={16} color="$green5" />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content
                    p={0}
                    mt="$2"
                    bg="$color2"
                    br="$6"
                    elevate
                    width="100%"
                    overflow="hidden"
                  >
                    {coins
                      ?.filter((item) => item.token !== fromToken.token)
                      .map((token, id) => (
                        <XStack
                          key={token.token}
                          cursor="pointer"
                          jc="space-between"
                          ai="center"
                          py="$3"
                          px="$5"
                          w="100%"
                          onPress={() => {
                            form.setValue('toToken', token)
                            setToDropdownOpen(false)
                          }}
                          hoverStyle={{ bg: '$color3' }}
                        >
                          <TokenItem coin={token} />
                        </XStack>
                      ))}
                  </Popover.Content>
                </Popover>
              </XStack>
              <XStack jc="space-between" ai="center">
                <Paragraph fontSize={14} color="$gray8">
                  ${toTokenPrice?.[toToken.coingeckoTokenId]?.usd ?? '0'}
                </Paragraph>
              </XStack>
            </YStack>
          </Card>
        </YStack>

        <Button
          theme="green"
          py={'$5'}
          br={'$4'}
          onPress={form.handleSubmit(() => console.log('Swap submitted'))}
        >
          <Paragraph fontWeight={'600'}>SEND</Paragraph>
        </Button>
      </YStack>
    </FormProvider>
  )
}
