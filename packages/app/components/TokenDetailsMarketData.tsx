import { Spinner, XStack, Paragraph, Theme } from '@my/ui'
import { ArrowUp, ArrowDown } from '@tamagui/lucide-icons'
import type { CoinWithBalance } from 'app/data/coins'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import { IconError } from './icons'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import formatAmount from 'app/utils/formatAmount'

export const TokenDetailsMarketData = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: tokenMarketData, isLoading: isLoadingMarketData } = useTokenMarketData(
    coin.coingeckoTokenId
  )

  const { data: prices, isLoading: isLoadingPrices } = useTokenPrices()

  const price = tokenMarketData?.at(0)?.current_price ?? prices?.[coin.token]
  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h ?? null

  // Coingecko API returns a formatted price already. For now, we just want to make sure it doesn't have more than 8 digits
  // so the text doesn't get cut off.

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
          {`1 ${coin.symbol} = ${formatAmount(price, 4, 2)} USD`.replace(/\s+/g, ' ')}
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
