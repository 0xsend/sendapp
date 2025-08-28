import {
  Button,
  ButtonText,
  Card,
  H4,
  Paragraph,
  Spinner,
  Theme,
  XStack,
  YStack,
  useThemeName,
} from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { useTokenMarketChartRange, toChartPointsFromPrices } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { useMemo, useState, useCallback } from 'react'
import { Dimensions, Platform } from 'react-native'
import Animated, { useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import {
  ChartPathProvider,
  ChartPath,
  ChartDot,
  monotoneCubicInterpolation,
  useChartData,
} from '@my/ui'

// Tabs styling mirrors SearchFilterButton in packages/app/components/SearchBar.tsx (lines 223–239)
// Width measurement mirrors onLayout pattern in packages/ui/src/components/FormWrapper.native.tsx (lines 37–41)

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

function getFromForTimeframe(tf: Timeframe): string {
  switch (tf) {
    case '1D':
      return '1'
    case '1W':
      return '7'
    case '1M':
      return '30'
    case '3M':
      return '90'
    case '6M':
      return '180'
    case '1Y':
      return '365'
    case 'ALL':
      // Long horizon; adjust if earliest price is known
      return 'max'
    default:
      return '1'
  }
}

function getInterpolationRange(tf: Timeframe): number {
  switch (tf) {
    case '1D':
      return 120
    case '1W':
      return 160
    case '1M':
      return 200
    case '3M':
      return 220
    case '6M':
      return 240
    case '1Y':
      return 280
    case 'ALL':
      return 300
    default:
      return 120
  }
}

// Coingecko interval/precision hints inspired by common usage patterns
function getCgParams(tf: Timeframe): { interval: string | null; precision: string | null } {
  switch (tf) {
    case '1D':
    case '1W':
    case '1M':
      return { interval: null, precision: '6' }
    case '3M':
    case '6M':
    case '1Y':
    case 'ALL':
      return { interval: null, precision: '6' }
    default:
      return { interval: null, precision: null }
  }
}

export function TokenChartSection({ coin }: { coin: CoinWithBalance }) {
  const [tf, setTf] = useState<Timeframe>('1D')
  const [measuredWidth, setMeasuredWidth] = useState<number>(0)
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const days = getFromForTimeframe(tf)

  const { interval, precision } = getCgParams(tf)

  const { data, isLoading, isError } = useTokenMarketChartRange(coin.coingeckoTokenId, {
    days,
    interval: interval ?? undefined,
    precision: precision ?? undefined,
  })

  const points = useMemo(() => {
    if (!data?.prices) return []
    return toChartPointsFromPrices({ prices: data.prices })
  }, [data?.prices])

  const smoothed = useMemo(() => {
    if (!points.length) return [] as { x: number; y: number }[]
    return monotoneCubicInterpolation({
      data: points,
      includeExtremes: true,
      range: getInterpolationRange(tf),
    })
  }, [points, tf])

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

  const onLayoutContainer = useCallback(
    (e: import('react-native').LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width
      if (typeof w === 'number' && w > 0 && w !== measuredWidth) {
        setMeasuredWidth(w)
      }
    },
    [measuredWidth]
  )

  const containerWidth = measuredWidth || Dimensions.get('window').width

  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        Price Overview
      </H4>
      <Card py="$5" px="$4" w={'100%'} elevation={Platform.OS === 'web' ? '$0.75' : 0}>
        <YStack gap={'$3'}>
          {isLoading ? (
            <Spinner size="small" color={'$color12'} />
          ) : points.length === 0 || isError ? (
            <Paragraph color={'$color10'}>No chart data</Paragraph>
          ) : (
            <>
              <YStack onLayout={onLayoutContainer}>
                <ChartSectionChart
                  points={points}
                  smoothed={smoothed}
                  width={containerWidth}
                  last={last ?? 0}
                  changeBadge={changeBadge}
                  decimals={coin.formatDecimals ?? 2}
                />
              </YStack>
            </>
          )}
          {/* Timeframe tabs moved to bottom */}
          <XStack ai="center" gap="$3" flexWrap="wrap">
            {TIMEFRAMES.map((label) => {
              const active = tf === label
              return (
                <Button
                  key={label}
                  chromeless
                  unstyled
                  onPress={() => setTf(label)}
                  borderBottomColor={isDark ? '$primary' : '$color12'}
                  borderBottomWidth={active ? 1 : 0}
                >
                  <ButtonText
                    color={active ? '$color12' : '$silverChalice'}
                    textTransform="uppercase"
                    size={'$3'}
                  >
                    {label}
                  </ButtonText>
                </Button>
              )
            })}
          </XStack>
        </YStack>
      </Card>
    </YStack>
  )
}

function ChartSectionChart({
  points,
  smoothed,
  width,
  last,
  changeBadge,
  decimals,
}: {
  points: { x: number; y: number }[]
  smoothed: { x: number; y: number }[]
  width: number
  last: number
  changeBadge: React.ReactNode
  decimals: number
}) {
  const H = 150
  const stroke = '#40FB50'
  const data = useMemo(
    () => ({ points: smoothed, nativePoints: points, curve: 'basis' as const }),
    [points, smoothed]
  )

  return (
    <ChartPathProvider
      data={data}
      width={width}
      height={H}
      color={stroke}
      selectedColor={stroke}
      endPadding={32}
    >
      <ChartScrubReadout fallbackPrice={last} changeBadge={changeBadge} decimals={decimals} />
      <ChartPath
        hapticsEnabled={false}
        width={width}
        height={H}
        stroke={stroke}
        selectedStrokeWidth={3}
        strokeWidth={3.5}
      />
      <ChartDot color={stroke} size={10} />
    </ChartPathProvider>
  )
}

function ChartScrubReadout({
  fallbackPrice,
  changeBadge,
  decimals,
}: {
  fallbackPrice: number
  changeBadge: React.ReactNode
  decimals: number
}) {
  const { isActive, originalX, originalY } = useChartData()
  const [price, setPrice] = useState<number | null>(null)
  const [ts, setTs] = useState<number | null>(null)

  useAnimatedReaction(
    () => ({ active: isActive.value, ox: originalX.value, oy: originalY.value }),
    (v) => {
      if (v.active && v.oy !== '') {
        runOnJS(setPrice)(Number(v.oy))
        if (v.ox !== '') runOnJS(setTs)(Number(v.ox))
      } else {
        runOnJS(setPrice)(null)
        runOnJS(setTs)(null)
      }
    }
  )

  const displayPrice = price ?? fallbackPrice
  const formattedPrice = `$${formatAmount(displayPrice, 9, decimals)}`

  const timeLabel = (() => {
    if (ts === null) return null
    try {
      const d = new Date(ts)
      return d.toLocaleString()
    } catch {
      return null
    }
  })()

  return (
    <YStack gap="$1" mb={'$1'}>
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
