import { Card, H4, Paragraph, Spinner, Theme, XStack, YStack } from '@my/ui'
import { useCoingeckoCoin, useTokensMarketData } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useTranslation } from 'react-i18next'

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
          <XStack
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            <Paragraph fontSize={'$2'} fontWeight={400}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <XStack
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(229, 115, 115, 0.2)' }}
            $theme-light={{ bc: 'rgba(229, 115, 115, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            <Paragraph fontSize={'$2'} fontWeight={400}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    return <Paragraph fontSize={'$2'}>{formatted}</Paragraph>
  })()

  return (
    <Card
      padded
      size={'$5'}
      elevation={1}
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

export function TokenKeyMetrics() {
  const { coin } = useCoinFromTokenParam()
  const { data: coingeckoCoin, isLoading: isLoadingCoingeckoCoin } = useCoingeckoCoin(
    coin?.coingeckoTokenId
  )
  const { data: marketData, isLoading: isLoadingMarketData } = useTokensMarketData()

  // Don't render if coin doesn't have CoinGecko ID
  if (!coin?.coingeckoTokenId) {
    return null
  }

  const mdM = marketData?.find((m) => m.id === coin.coingeckoTokenId)
  const md = coingeckoCoin?.market_data

  const isLoading = !!isLoadingMarketData || isLoadingCoingeckoCoin

  const marketCap = mdM?.market_cap ?? null
  const marketCapChange = mdM?.market_cap_change_percentage_24h ?? null
  const fdv = mdM?.fully_diluted_valuation ?? null
  // FDV change is not provided explicitly;
  const fdvChange = null

  const volume = mdM?.total_volume ?? null
  // Volume 24h change is not provided by the endpoint; omit the badge when not available.
  const volumeChange = null
  // Use circulating supply from market data (includes Canton) or detailed CoinGecko data
  const circulating = mdM?.circulating_supply ?? md?.circulating_supply ?? null
  const { t } = useTranslation('home')

  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        {t('token.keyMetrics')}
      </H4>
      {isLoading ? (
        <Spinner size="small" color={'$color12'} />
      ) : (
        <XStack gap={'$3'} flexWrap="wrap" w="100%">
          <MetricTile
            title={t('token.metrics.marketCap')}
            value={`$${formatAmount(marketCap ?? undefined, 5, 0)}`}
            change={marketCapChange ?? undefined}
          />
          <MetricTile
            title={t('token.metrics.fdv')}
            value={`$${formatAmount(fdv ?? undefined, 5, 0)}`}
            change={fdvChange ?? undefined}
          />
          <MetricTile
            title={t('token.metrics.volume24h')}
            value={`$${formatAmount(volume ?? undefined, 5, 0)}`}
            change={volumeChange ?? undefined}
          />
          <MetricTile
            title={t('token.metrics.circulatingSupply')}
            value={`${formatAmount(circulating ?? undefined, 5, 0)} ${coin?.symbol ?? ''}`}
            change={null}
          />
        </XStack>
      )}
    </YStack>
  )
}
