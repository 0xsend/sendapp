import { Card, H4, Paragraph, Spinner, Theme, XStack, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { useTokenMarketChartRange, toChartPointsFromPrices } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { useMemo } from 'react'
import { Dimensions, Platform } from 'react-native'
import { ChartPathProvider, ChartPath, ChartDot, monotoneCubicInterpolation } from '@my/ui'

export function TokenChartSection({ coin }: { coin: CoinWithBalance }) {
  const nowSec = Math.floor(Date.now() / 1000)
  const from = nowSec - 86400 // 1D default

  const { data, isLoading, isError } = useTokenMarketChartRange(coin.coingeckoTokenId, {
    from,
    to: nowSec,
  })

  const points = useMemo(() => {
    if (!data?.prices) return []
    return toChartPointsFromPrices({ prices: data.prices })
  }, [data?.prices])

  const smoothed = useMemo(() => {
    if (!points.length) return [] as { x: number; y: number }[]
    return monotoneCubicInterpolation({ data: points, includeExtremes: true, range: 100 })
  }, [points])

  const first = points[0]?.y
  const last = points.at(-1)?.y
  const change = first && last ? ((last - first) / first) * 100 : null

  const changeBadge = (() => {
    if (change === null || change === undefined) return null
    const formatted = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
    if (change > 0)
      return (
        <Theme name="green_active">
          <Paragraph fontSize={'$3'} fontWeight={500} bc={'$color2'} px={'$1.5'} br={'$2'}>
            {formatted}
          </Paragraph>
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <Paragraph fontSize={'$3'} fontWeight={500} bc={'$color2'} px={'$1.5'} br={'$2'}>
            {formatted}
          </Paragraph>
        </Theme>
      )
    return <Paragraph fontSize={'$3'}>{formatted}</Paragraph>
  })()

  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        Price Chart
      </H4>
      <Card py="$5" px="$4" w={'100%'} elevation={Platform.OS === 'web' ? '$0.75' : 0}>
        <YStack gap={'$3'}>
          {isLoading ? (
            <Spinner size="small" color={'$color12'} />
          ) : points.length === 0 || isError ? (
            <Paragraph color={'$color10'}>No chart data</Paragraph>
          ) : (
            <>
              <XStack ai="center" gap={'$2'}>
                <Paragraph size={'$5'} fontWeight={500} color={'$color12'}>
                  ${formatAmount(last ?? undefined, 9, coin.formatDecimals ?? 2)}
                </Paragraph>
                {changeBadge}
              </XStack>
              {/* Real chart */}
              <ChartSectionChart points={points} smoothed={smoothed} />
            </>
          )}
        </YStack>
      </Card>
    </YStack>
  )
}

function ChartSectionChart({
  points,
  smoothed,
}: {
  points: { x: number; y: number }[]
  smoothed: { x: number; y: number }[]
}) {
  const W = Dimensions.get('window').width
  const H = 150
  const stroke = '#4e7aff'
  const data = useMemo(
    () => ({ points: smoothed, nativePoints: points, curve: 'basis' as const }),
    [points, smoothed]
  )

  return (
    <ChartPathProvider
      data={data}
      width={W}
      height={H}
      color={stroke}
      selectedColor={stroke}
      endPadding={32}
    >
      <ChartPath
        hapticsEnabled={false}
        width={W}
        height={H}
        stroke={stroke}
        selectedStrokeWidth={3}
        strokeWidth={3.5}
      />
      <ChartDot color={stroke} size={10} />
    </ChartPathProvider>
  )
}
