import { useMemo } from 'react'
import {
  useTokenMarketChart,
  toChartPointsFromPrices,
  useTokensMarketData,
} from 'app/utils/coin-gecko'
import { getDaysForTimeframe, getInterpolationRange, type Timeframe } from './timeframes'
import { monotoneCubicInterpolation } from '@my/ui'
import type { CoingeckoId } from 'app/data/coins'

export function useTokenChartData(tokenId: CoingeckoId | undefined, tf: Timeframe) {
  const days = getDaysForTimeframe(tf)

  const { data, isLoading, isError } = useTokenMarketChart(tokenId, {
    days,
  })

  const { data: marketData } = useTokensMarketData()

  const points = useMemo(() => {
    if (!data?.prices) return [] as { x: number; y: number }[]
    const historicalPoints = toChartPointsFromPrices({ prices: data.prices })

    // Append current price as the latest data point
    const currentMarketData = marketData?.find((m) => m.id === tokenId)
    if (currentMarketData?.current_price && currentMarketData?.last_updated) {
      const currentTimestamp = new Date(currentMarketData.last_updated).getTime()
      const lastHistoricalPoint = historicalPoints[historicalPoints.length - 1]

      // Only append if this is genuinely new data (more than 5 minutes since last point)
      const TIME_GAP_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds
      const shouldAppend =
        !lastHistoricalPoint || currentTimestamp - lastHistoricalPoint.x > TIME_GAP_THRESHOLD

      if (shouldAppend) {
        return [...historicalPoints, { x: currentTimestamp, y: currentMarketData.current_price }]
      }
    }

    return historicalPoints
  }, [data?.prices, marketData, tokenId])

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
