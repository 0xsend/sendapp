import { Paragraph, Theme, YStack, XStack, useThemeName } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import formatAmount from 'app/utils/formatAmount'
import { useState } from 'react'
import { Dimensions, type LayoutChangeEvent } from 'react-native'
import { ChartCardSection } from './charts/shared/components/ChartCardSection'
import { TimeframeTabs } from './charts/shared/components/TimeframeTabs'
import { ChartLineSection } from './charts/shared/components/ChartLineSection'
import { ChartExtremeLabels } from './charts/shared/components/ChartExtremeLabels'
import { useTokenChartData } from './charts/shared/useTokenChartData'
import { useScrubState } from './charts/shared/useScrubState.native'
import type { Timeframe } from './charts/shared/timeframes'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

export function TokenChartSection() {
  const [tf, setTf] = useState<Timeframe>('1W')
  const { coin } = useCoinFromTokenParam()
  const { points, smoothed, last, change } = useTokenChartData(coin?.coingeckoTokenId, tf)

  const [measuredWidth, setMeasuredWidth] = useState<number>(0)
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const onLayoutContainer = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (typeof w === 'number' && w > 0 && w !== measuredWidth) {
      setMeasuredWidth(w)
    }
  }

  const containerWidth = measuredWidth || Dimensions.get('window').width

  // Don't render if coin doesn't have CoinGecko ID
  if (!coin?.coingeckoTokenId || coin === undefined) {
    return null
  }

  return (
    <ChartCardSection title="Price Overview" tf={tf}>
      <YStack onLayout={onLayoutContainer}>
        <ChartSection
          coin={coin}
          tf={tf}
          points={points}
          smoothed={smoothed}
          width={containerWidth}
          last={last}
          change={change}
        />
      </YStack>
      <TimeframeTabs value={tf} onChange={setTf} isDark={isDark} />
    </ChartCardSection>
  )
}

function ChartSection({
  coin,
  tf,
  points,
  smoothed,
  width,
  last,
  change,
}: {
  coin: CoinWithBalance
  tf: Timeframe
  points: { x: number; y: number }[]
  smoothed: { x: number; y: number }[]
  width: number
  last: number
  change: number | null
}) {
  const { isError, isLoading } = useTokenChartData(coin.coingeckoTokenId, tf)
  const isDark = useThemeName()?.startsWith('dark')
  const stroke = isDark ? '#40FB50' : '#000000'
  const changeBadge = (() => {
    if (change === null || change === undefined) return null as React.ReactNode
    const formatted = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
    if (change > 0)
      return (
        <Theme name="green_active">
          <XStack
            px={'$1.5'}
            br={'$2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
          >
            <Paragraph fontSize={'$3'} fontWeight={500}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <XStack
            px={'$1.5'}
            br={'$2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
          >
            <Paragraph fontSize={'$3'} fontWeight={500}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    return <Paragraph fontSize={'$3'}>{formatted}</Paragraph>
  })()

  return (
    <ChartLineSection
      points={points}
      smoothed={smoothed}
      width={width}
      stroke={stroke}
      childrenBeforePath={
        isLoading ? null : isError ? (
          <Paragraph color={'$color10'}>Failed to load chart data</Paragraph>
        ) : (
          <ChartScrubReadout
            fallbackPrice={last}
            decimals={last > 0.1 ? 2 : 5}
            changeBadge={changeBadge}
          />
        )
      }
      childrenAfterPath={<ChartExtremeLabelsWithActive decimals={last > 0.1 ? 2 : 5} />}
    />
  )
}

function ChartScrubReadout({
  fallbackPrice,
  decimals,
  changeBadge,
}: {
  fallbackPrice: number
  decimals: number
  changeBadge: React.ReactNode
}) {
  const { price, ts } = useScrubState()
  const displayPrice = price ?? fallbackPrice
  const formattedPrice = `$${formatAmount(displayPrice, 9, decimals)}`

  const timeLabel = (() => {
    if (ts === null)
      return new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    try {
      const d = new Date(ts)
      return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    } catch {
      return null
    }
  })()

  return (
    <YStack gap="$1" mb={'$5'}>
      <XStack ai="center" gap={'$2'}>
        <Paragraph size={'$5'} fontWeight={500} color={'$color12'}>
          {formattedPrice}
        </Paragraph>
        {price === null ? changeBadge : null}
      </XStack>
      {timeLabel ? (
        <Paragraph size={'$3'} color={'$color10'}>
          {timeLabel}
        </Paragraph>
      ) : null}
    </YStack>
  )
}

function ChartExtremeLabelsWithActive({ decimals }: { decimals: number }) {
  const { active } = useScrubState()
  return <ChartExtremeLabels decimals={decimals} active={active} />
}
