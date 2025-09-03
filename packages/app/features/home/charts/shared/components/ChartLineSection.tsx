import { ChartPathProvider, ChartPath, ChartDot } from '@my/ui'
import { useMemo } from 'react'
import { View } from 'react-native'

export function ChartLineSection({
  points,
  smoothed,
  width,
  stroke,
  endPadding = 0,
  childrenBeforePath,
  childrenAfterPath,
  pathProps = {},
}: {
  points: { x: number; y: number }[]
  smoothed: { x: number; y: number }[]
  width: number
  stroke: string
  endPadding?: number
  childrenBeforePath?: React.ReactNode
  childrenAfterPath?: React.ReactNode
  pathProps?: Record<string, unknown>
}) {
  const H = 200
  const data = useMemo(
    () => ({ points: smoothed, nativePoints: points, curve: 'basis' as const }),
    [points, smoothed]
  )

  return (
    <View style={{ width }}>
      <ChartPathProvider
        data={data}
        width={width}
        height={H}
        color={stroke}
        selectedColor={stroke}
        endPadding={endPadding}
      >
        {/* Scrub readout in normal flow above the chart */}
        {childrenBeforePath}
        {/* Fixed-height chart area below */}
        <View style={{ height: H, width }}>
          <ChartPath
            width={width}
            height={H}
            stroke={stroke}
            fill="none"
            selectedStrokeWidth={3}
            strokeWidth={3.5}
            panGestureHandlerProps={pathProps as never}
            onScrub={
              typeof pathProps?.onScrub === 'function'
                ? (pathProps.onScrub as (payload: {
                    active: boolean
                    ox?: number
                    oy?: number
                  }) => void)
                : undefined
            }
          />
          {childrenAfterPath}
          <ChartDot color={stroke} size={10} />
        </View>
      </ChartPathProvider>
    </View>
  )
}
