import { ChartPathProvider, ChartPath, ChartDot, View } from '@my/ui'
import { useMemo } from 'react'
import { useScrollNativeGesture } from '@my/ui/src/gestures/ScrollGestureContext'

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

  const native = useScrollNativeGesture()

  const gesturePad = 24
  const { onScrub, ...restPathProps } = (pathProps ?? {}) as {
    onScrub?: (payload: { active: boolean; ox?: number; oy?: number }) => void
  } & Record<string, unknown>

  const mergedPanProps = {
    shouldCancelWhenOutside: false,
    hitSlop: { top: gesturePad, bottom: gesturePad },
    nativeScrollGesture: native ?? undefined,
    ...restPathProps,
  } as never

  return (
    <View w={width}>
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
        <View h={H} w={width}>
          <ChartPath
            width={width}
            height={H}
            stroke={stroke}
            fill="none"
            selectedStrokeWidth={5}
            strokeWidth={3.5}
            panGestureHandlerProps={mergedPanProps}
            onScrub={
              typeof onScrub === 'function'
                ? (onScrub as (payload: {
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
