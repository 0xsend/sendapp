import { useMemo } from 'react'
import { useTokenMarketChart, toChartPointsFromPrices } from 'app/utils/coin-gecko'
import {
  getCgParams,
  getDaysForTimeframe,
  getInterpolationRange,
  type Timeframe,
} from './timeframes'
import { monotoneCubicInterpolation } from '@my/ui'

export function useTokenChartData(tokenId: string, tf: Timeframe) {
  const { interval, precision } = getCgParams(tf)
  const days = getDaysForTimeframe(tf)

  const { data, isLoading, isError } = useTokenMarketChart(tokenId, {
    days,
    interval: interval ?? undefined,
    precision: precision ?? undefined,
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
