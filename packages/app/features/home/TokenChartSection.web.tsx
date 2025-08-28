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
import { ChartPathProvider, ChartPath, ChartDot, monotoneCubicInterpolation } from '@my/ui'

const ONE_DAY = 86400
const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

function getFromForTimeframe(tf: Timeframe, nowSec: number): number {
  switch (tf) {
    case '1D':
      return nowSec - ONE_DAY
    case '1W':
      return nowSec - 7 * ONE_DAY
    case '1M':
      return nowSec - 30 * ONE_DAY
    case '3M':
      return nowSec - 90 * ONE_DAY
    case '6M':
      return nowSec - 180 * ONE_DAY
    case '1Y':
      return nowSec - 365 * ONE_DAY
    case 'ALL':
      return nowSec - 5 * 365 * ONE_DAY
    default:
      return nowSec - ONE_DAY
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

function getCgParams(tf: Timeframe): { interval: string | null; precision: string | null } {
  switch (tf) {
    case '1D':
    case '1W':
    case '1M':
      return { interval: 'hourly', precision: '2' }
    case '3M':
    case '6M':
    case '1Y':
    case 'ALL':
      return { interval: 'daily', precision: '2' }
    default:
      return { interval: null, precision: null }
  }
}

export function TokenChartSection({ coin }: { coin: CoinWithBalance }) {
  const [tf, setTf] = useState<Timeframe>('1D')
  const [measuredWidth, setMeasuredWidth] = useState<number>(0)
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const nowSec = Math.floor(Date.now() / 1000)
  const from = getFromForTimeframe(tf, nowSec)

  const { interval, precision } = getCgParams(tf)

  const { data, isLoading, isError } = useTokenMarketChartRange(coin.coingeckoTokenId, {
    from,
    to: nowSec,
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
        Price Chart
      </H4>
      <Card py="$5" px="$4" w={'100%'} elevation={Platform.OS === 'web' ? '$0.75' : 0}>
        <YStack gap={'$3'}>
          {/* Timeframe tabs */}
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

          {isLoading ? (
            <Spinner size="small" color={'$color12'} />
          ) : points.length === 0 || isError ? (
            <Paragraph color={'$color10'}>No chart data</Paragraph>
          ) : (
            <>
              <YStack onLayout={onLayoutContainer}>
                <ChartSectionChartWeb
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
        </YStack>
      </Card>
    </YStack>
  )
}

function ChartSectionChartWeb({
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
  const stroke = '#4e7aff'
  const data = useMemo(
    () => ({ points: smoothed, nativePoints: points, curve: 'basis' as const }),
    [points, smoothed]
  )

  const [price, setPrice] = useState<number | null>(null)
  const [ts, setTs] = useState<number | null>(null)
  const [active, setActive] = useState<boolean>(false)

  return (
    <ChartPathProvider
      data={data}
      width={width}
      height={H}
      color={stroke}
      selectedColor={stroke}
      endPadding={32}
    >
      <ChartScrubReadoutWeb
        fallbackPrice={last}
        changeBadge={changeBadge}
        decimals={decimals}
        price={price}
        ts={ts}
      />
      <ChartPath
        width={width}
        height={H}
        stroke={stroke}
        selectedStrokeWidth={3}
        strokeWidth={3.5}
        onScrub={(p) => {
          setActive(p.active)
          if (p.active && typeof p.oy === 'number') {
            setPrice(p.oy)
            if (typeof p.ox === 'number') setTs(p.ox)
          } else {
            setPrice(null)
            setTs(null)
          }
        }}
      />
      <ChartExtremeLabelsWeb decimals={decimals} active={active} />
      <ChartDot color={stroke} size={10} />
    </ChartPathProvider>
  )
}

function ChartScrubReadoutWeb({
  fallbackPrice,
  changeBadge,
  decimals,
  price,
  ts,
}: {
  fallbackPrice: number
  changeBadge: React.ReactNode
  decimals: number
  price: number | null
  ts: number | null
}) {
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

function ChartExtremeLabelsWeb({ decimals, active }: { decimals: number; active: boolean }) {
  // Use context to read currentPath directly (no reanimated hooks)
  // Import hook directly to preserve types
  // Define a minimal type for the context shape we use here
  type WebPoint = { x: number; y: number; originalX: number; originalY: number }
  type WebChartCtx = { currentPath: { points: WebPoint[] } | null; width: number; height: number }
  const { useChartData } = require('@my/ui') as { useChartData: () => WebChartCtx }
  const { currentPath, width, height } = useChartData()

  const labels = useMemo(() => {
    if (!currentPath || !currentPath.points || currentPath.points.length === 0) return null

    let minP = currentPath.points[0]
    let maxP = currentPath.points[0]
    for (const p of currentPath.points) {
      if (!p) continue
      if (p.originalY < (minP?.originalY ?? Number.POSITIVE_INFINITY)) minP = p
      if (p.originalY > (maxP?.originalY ?? Number.NEGATIVE_INFINITY)) maxP = p
    }
    if (!minP || !maxP) return null

    const labelFor = (p: typeof minP) => {
      const rawY = p.originalY
      const text = `$${formatAmount(rawY, 9, decimals)}`
      const estWidth = 72
      const estHeight = 20
      const x = Math.min(Math.max(p.x - estWidth / 2, 0), Math.max(0, width - estWidth))
      const y = Math.max(p.y - estHeight - 6, 0)
      return { x, y, text }
    }

    return { min: labelFor(minP), max: labelFor(maxP) }
  }, [currentPath, width, decimals])

  if (!labels || active) return null

  return (
    <YStack style={{ position: 'absolute', left: 0, top: 0, width, height }} pointerEvents="none">
      <YStack
        position="absolute"
        left={labels.max.x}
        top={labels.max.y}
        bg={'$color2'}
        px={'$1.5'}
        py={'$0.5'}
        br={'$2'}
      >
        <Paragraph size={'$3'} color={'$color12'} fontWeight={500}>
          {labels.max.text}
        </Paragraph>
      </YStack>
      <YStack
        position="absolute"
        left={labels.min.x}
        top={labels.min.y}
        bg={'$color2'}
        px={'$1.5'}
        py={'$0.5'}
        br={'$2'}
      >
        <Paragraph size={'$3'} color={'$color12'} fontWeight={500}>
          {labels.min.text}
        </Paragraph>
      </YStack>
    </YStack>
  )
}
