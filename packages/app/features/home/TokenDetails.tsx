import { Card, Paragraph, Separator, Spinner, Stack, Theme, XStack, YStack } from '@my/ui'
import type { allCoins, CoinWithBalance } from 'app/data/coins'
import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { IconCoin, IconError } from 'app/components/icons'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import formatAmount from 'app/utils/formatAmount'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { TokenActivity } from './TokenActivity'
import { HomeQuickActions } from 'app/features/home/HomeQuickActions'

export const TokenDetails = ({ coin }: { coin: CoinWithBalance }) => {
  return (
    <YStack f={1} gap="$5" $gtLg={{ w: '45%', pb: '$0' }} pb="$5">
      <YStack gap="$3.5" $gtLg={{ gap: '$5' }}>
        <Card p="$4.5" w={'100%'} jc={'space-between'} $gtLg={{ h: 244, p: '$6' }}>
          <YStack gap="$4">
            <XStack ai={'center'} gap={'$3'}>
              <IconCoin size={'$2'} symbol={coin.symbol} />
              <Paragraph size={'$7'} fontFamily={'$mono'} col={'$color12'} fontWeight={'500'}>
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
        <HomeQuickActions />
      </YStack>
      <YStack gap={'$3'}>
        <TokenActivity coin={coin} />
      </YStack>
    </YStack>
  )
}

export const TokenDetailsMarketData = ({ coin }: { coin: allCoins[number] }) => {
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

  const isUSDC = coin.symbol === 'USDC'

  return (
    <XStack gap="$3">
      <Paragraph
        fontSize={14}
        fontWeight="500"
        $theme-dark={{ color: '$gray8Light' }}
        color={'$color12'}
      >
        {(() => {
          switch (true) {
            case isLoadingPrices:
              return <Spinner size="small" color={'$color12'} />
            case price === undefined:
              return null
            case isUSDC:
              return `1 ${coin.symbol} = 1 USD`
            default:
              return `1 ${coin.symbol} = ${formatPrice(price)} USD`
          }
        })()}
      </Paragraph>
      {(() => {
        switch (true) {
          case isLoadingMarketData:
            return <Spinner size="small" color={'$color12'} />
          case changePercent24h === null:
            return (
              <XStack gap="$2" ai="center">
                <Paragraph color="$color10">Failed to load market data</Paragraph>
                <IconError size="$1.75" color={'$redVibrant'} />
              </XStack>
            )
          case isUSDC:
            return null
          default:
            return formatPriceChange(changePercent24h)
        }
      })()}
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
