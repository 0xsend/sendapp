import { Card, H4, Paragraph, Spinner, Theme, XStack, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { useCoinData } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { Platform } from 'react-native'

function MetricTile({
  title,
  value,
  change,
}: {
  title: string
  value: string
  change?: number | null
}) {
  const changeBadge = (() => {
    if (change === null || change === undefined) return null
    const formatted = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    if (change > 0)
      return (
        <Theme name="green_active">
          <Paragraph
            fontSize={'$2'}
            fontWeight={400}
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            {formatted}
          </Paragraph>
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <Paragraph
            fontSize={'$2'}
            fontWeight={400}
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(229, 115, 115, 0.2)' }}
            $theme-light={{ bc: 'rgba(229, 115, 115, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            {formatted}
          </Paragraph>
        </Theme>
      )
    return <Paragraph fontSize={'$2'}>{formatted}</Paragraph>
  })()

  return (
    <Card
      padded
      size={'$5'}
      elevation={Platform.OS === 'web' ? '$0.75' : 0}
      f={1}
      fb="48%"
      $xxs={{ fb: '100%' }}
      w="100%"
      jc="center"
      ai="center"
    >
      <YStack gap={'$2'} jc="center" ai="center">
        <Paragraph color={'$color10'} size={'$4'}>
          {title}
        </Paragraph>
        <XStack ai="center" gap={'$2'}>
          <Paragraph size={'$5'} fontWeight={500} color={'$color12'}>
            {value}
          </Paragraph>
          {changeBadge}
        </XStack>
      </YStack>
    </Card>
  )
}

export function TokenKeyMetrics({ coin }: { coin: CoinWithBalance }) {
  const { data, isLoading } = useCoinData(coin.coingeckoTokenId)
  const md = data?.market_data

  if (isLoading) return <Spinner size="small" color={'$color12'} />

  const marketCap = md?.market_cap?.usd ?? null
  const marketCapChange =
    md?.market_cap_change_percentage_24h ??
    md?.market_cap_change_percentage_24h_in_currency?.usd ??
    null
  const fdv = md?.fully_diluted_valuation?.usd ?? null
  // FDV change is not provided explicitly; fallback to price change percentage as an approximation.
  const fdvChange =
    md?.price_change_percentage_24h_in_currency?.usd ?? md?.price_change_percentage_24h ?? null
  const volume = md?.total_volume?.usd ?? null
  // Volume 24h change is not provided by the endpoint; omit the badge when not available.
  const volumeChange = null
  const circulating = md?.circulating_supply ?? null

  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        Key Metrics
      </H4>
      <XStack gap={'$3'} flexWrap="wrap" w="100%">
        <MetricTile
          title="Market Cap"
          value={formatAmount(marketCap ?? undefined, 5, 0)}
          change={marketCapChange ?? undefined}
        />
        <MetricTile
          title="FDV"
          value={formatAmount(fdv ?? undefined, 5, 0)}
          change={fdvChange ?? undefined}
        />
        <MetricTile
          title="Volume (24h)"
          value={formatAmount(volume ?? undefined, 5, 0)}
          change={volumeChange ?? undefined}
        />
        <MetricTile
          title="Circulating Supply"
          value={`${formatAmount(circulating ?? undefined, 5, 0)} ${coin.symbol}`}
          change={null}
        />
      </XStack>
    </YStack>
  )
}
