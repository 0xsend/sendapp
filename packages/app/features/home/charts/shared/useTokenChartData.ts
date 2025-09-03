import { useMemo } from 'react'
import { useTokenMarketChart, toChartPointsFromPrices } from 'app/utils/coin-gecko'
import { getDaysForTimeframe, getInterpolationRange, type Timeframe } from './timeframes'
import { monotoneCubicInterpolation } from '@my/ui'
import type { CoingeckoId } from 'app/data/coins'

export function useTokenChartData(tokenId: CoingeckoId | undefined, tf: Timeframe) {
  const days = getDaysForTimeframe(tf)

  const { data, isLoading, isError } = useTokenMarketChart(tokenId, {
    days,
  })

  const points = useMemo(() => {
    if (!data?.prices) return [] as { x: number; y: number }[]
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

  return {
    points,
    smoothed,
    last: last ?? 0,
    change,
    isLoading,
    isError,
  }
}
