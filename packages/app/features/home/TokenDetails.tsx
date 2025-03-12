import {
  AnimatePresence,
  Card,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { IconError } from 'app/components/icons'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { TokenActivity } from './TokenActivity'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { IconCoin } from 'app/components/icons/IconCoin'

export function AnimateEnter({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="200ms"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        opacity={1}
      >
        {children}
      </Stack>
    </AnimatePresence>
  )
}
export const TokenDetails = ({ coin }: { coin: CoinWithBalance }) => {
  return (
    <YStack f={1} gap="$5" $gtLg={{ w: '45%', pb: '$0' }} pb="$5">
      <YStack gap="$5">
        <Card p="$4.5" w={'100%'} jc={'space-between'} $gtLg={{ h: 244, p: '$6' }}>
          <YStack gap="$4">
            <XStack ai={'center'} gap={'$3'}>
              <IconCoin size={'$2'} symbol={coin.symbol} />
              <Paragraph
                size={'$7'}
                fontFamily={'$mono'}
                col={'$color12'}
                textTransform="uppercase"
                fontWeight={'700'}
              >
                {coin.label}
              </Paragraph>
            </XStack>
            <YStack gap={'$4'}>
              <TokenDetailsBalance coin={coin} />
              {coin.symbol !== 'USDC' && (
                <>
                  <Stack w={'100%'}>
                    <Separator bc={'$color10'} />
                  </Stack>
                  <TokenDetailsMarketData coin={coin} />
                </>
              )}
            </YStack>
          </YStack>
        </Card>
        {/* <XStack w={'100%'}>
          <LinkableButton href="/deposit" p="$7" mih={88} w="30%">
            <YStack gap="$2" jc={'space-between'} ai="center">
              <Theme name="green">
                <IconPlus
                  size={'$1.5'}
                  $theme-dark={{ color: '$color4' }}
                  $theme-light={{ color: '$color12' }}
                />
              </Theme>
              <Button.Text fontSize={'$4'} px="$2">
                Deposit
              </Button.Text>
            </YStack>
          </LinkableButton>
        </XStack> */}
      </YStack>
      <YStack gap={'$3'}>
        <TokenActivity coin={coin} />
      </YStack>
    </YStack>
  )
}

export const TokenDetailsMarketData = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: tokenMarketData, isLoading: isLoadingMarketData } = useTokenMarketData(
    coin.coingeckoTokenId
  )

  const { data: prices, isLoading: isLoadingPrices } = useTokenPrices()

  const price = tokenMarketData?.at(0)?.current_price ?? prices?.[coin.token]

  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h ?? null

  // Coingecko API returns a formatted price already. For now, we just want to make sure it doesn't have more than 8 digits
  // so the text doesn't get cut off.
  const formatPrice = (price: number) => price.toString().slice(0, 7)

  const formatPriceChange = (change: number) => {
    const fixedChange = change.toFixed(2)
    if (change > 0)
      return (
        <Theme name="green_active">
          <Paragraph fontSize="$4" fontWeight="500">{`${fixedChange}%`}</Paragraph>
          <ArrowUp size={'$0.9'} />
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <Paragraph fontSize="$4" fontWeight="500">{`${fixedChange}%`}</Paragraph>
          <ArrowDown size={'$0.9'} />
        </Theme>
      )
    return <Paragraph fontSize="$4" fontWeight="500">{`${fixedChange}%`}</Paragraph>
  }

  if (isLoadingMarketData && isLoadingPrices) return <Spinner size="small" color={'$color12'} />

  return (
    <XStack gap="$3">
      {isLoadingPrices ? (
        <Spinner size="small" color={'$color12'} />
      ) : (
        <Paragraph
          fontSize={14}
          fontWeight="500"
          $theme-dark={{ color: '$gray8Light' }}
          color={'$color12'}
        >
          {price === undefined ? '' : `1 ${coin.symbol} = ${formatPrice(price)} USD`}
        </Paragraph>
      )}
      {isLoadingMarketData ? (
        <Spinner size="small" color={'$color12'} />
      ) : (
        <XStack gap={'$1.5'} ai="center" jc={'space-around'}>
          {changePercent24h === null ? (
            <XStack gap="$2" ai="center">
              <Paragraph color="$color10">Failed to load market data</Paragraph>
              <IconError size="$1.75" color={'$redVibrant'} />
            </XStack>
          ) : (
            formatPriceChange(changePercent24h)
          )}
        </XStack>
      )}
    </XStack>
  )
}

const TokenDetailsBalance = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const { balance, decimals, formatDecimals = 5 } = coin

  if (coin.balance === undefined) {
    return <></>
  }

  const balanceInUSD = convertBalanceToFiat(coin, tokenPrices?.[coin.token])

  const balanceWithDecimals = Number(balance) / 10 ** (decimals ?? 0)
  const balanceWithDecimalsLength = balanceWithDecimals.toString().replace('.', '').length

  return (
    <XStack ai="flex-end" gap="$2">
      <Paragraph
        $platform-web={{ width: 'fit-content' }}
        $sm={{ fontSize: balanceWithDecimalsLength ? '$10' : 68, lineHeight: 38 }}
        fontSize={60}
        fontWeight={'900'}
        lineHeight={57}
        color={'$color12'}
      >
        {formatAmount(balanceWithDecimals.toString(), 10, formatDecimals)}
      </Paragraph>

      {coin.symbol !== 'USDC' ? (
        <Paragraph color={'$color10'} fontSize={'$3'} fontFamily={'$mono'}>
          {isLoadingTokenPrices || balanceInUSD === undefined
            ? ''
            : `($${formatAmount(balanceInUSD)})`}
        </Paragraph>
      ) : null}
    </XStack>
  )
}
