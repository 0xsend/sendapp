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

      // Data freshness validation: check if market data is stale
      const STALE_THRESHOLD_MS = 60 * 1000 // 1 minute (slightly > 45s refetch interval)
      const dataAge = Date.now() - currentTimestamp
      const isFresh = dataAge < STALE_THRESHOLD_MS

      // Only append if this is genuinely new data (more than 5 minutes since last point)
      const TIME_GAP_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds
      const shouldAppend =
        !lastHistoricalPoint || currentTimestamp - lastHistoricalPoint.x > TIME_GAP_THRESHOLD

      if (isFresh && shouldAppend) {
        // Interpolation smoothness: validate that new point doesn't create extreme jumps
        if (lastHistoricalPoint) {
          const priceChange =
            Math.abs(currentMarketData.current_price - lastHistoricalPoint.y) /
            lastHistoricalPoint.y
          const ANOMALY_THRESHOLD = 0.1 // 10% change

          if (priceChange > ANOMALY_THRESHOLD) {
            console.warn(
              `[useTokenChartData] Large price jump detected for ${tokenId}: ${(priceChange * 100).toFixed(2)}%`
            )
          }
        }

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
