import React, { useCallback, useMemo, useRef } from 'react'
import { View } from 'react-native'
import Svg, { Path, type PathProps } from 'react-native-svg'
import { useChartData } from '../../helpers/useChartData'

// Web fallback for ChartPath without Reanimated worklets.
// Implements mouse-based scrubbing using regular React events.

type ChartPathWebProps = PathProps & {
  width: number
  height: number
  stroke?: string
  strokeWidth?: number
  selectedStrokeWidth?: number
  gestureEnabled?: boolean
}

function least(length: number, compare: (value: number) => number) {
  let bound1 = 0
  let bound2 = length - 1
  while (true) {
    const pivot = Math.round(bound1 + (bound2 - bound1) / 2)
    if (bound1 === bound2) return bound1
    const areTwoLeft = bound2 === bound1 + 1
    if (compare(pivot - 1) - compare(pivot) > 0) {
      if (areTwoLeft) return pivot
      bound1 = pivot
    } else {
      bound2 = pivot
      if (areTwoLeft) return pivot - 1
    }
  }
}

function getYForXFromPoints(points: { x: number; y: number }[], x: number): number | null {
  if (!points || points.length === 0) return null
  const first = points[0]
  if (!first) return null
  if (x <= first.x) return first.y
  const last = points[points.length - 1]
  if (!last) return null
  if (x >= last.x) return last.y
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (!p1 || !p2) continue
    if (x === p1.x) return p1.y
    if (x > p1.x && x <= p2.x) {
      const t = (x - p1.x) / (p2.x - p1.x)
      return p1.y + t * (p2.y - p1.y)
    }
  }
  return null
}

export const ChartPath = React.memo(
  ({
    width,
    height,
    stroke = 'black',
    strokeWidth = 1,
    gestureEnabled = true,
    ...rest
  }: ChartPathWebProps) => {
    const {
      currentPath,
      originalX,
      originalY,
      isActive,
      positionX,
      positionY,
      stroke: ctxStroke,
      width: chartPathWidth,
    } = useChartData()

    const containerRef = useRef<View | null>(null)

    const resetGestureState = useCallback(() => {
      originalX.value = ''
      originalY.value = ''
      positionY.value = -1
      isActive.value = false
    }, [originalX, originalY, positionY, isActive])

    const updatePosition = useCallback(
      (x: number, y: number) => {
        const path = currentPath
        if (!path || path.points.length === 0) return

        const clampedX = Math.max(0, Math.min(x, chartPathWidth))
        const yForX = getYForXFromPoints(path.points, clampedX)
        if (yForX !== null) {
          positionY.value = yForX
        }
        positionX.value = clampedX

        const index = least(path.points.length, (i) => {
          const p = path.points[i]
          return Math.abs((p ? p.x : 0) - clampedX)
        })

        const idx = Math.max(0, Math.min(index, path.points.length - 1))
        const basePoint = path.points[idx]
        const pointX = basePoint ? basePoint.originalX : (path.data[0]?.x ?? 0)

        let adjustedPointX = pointX
        const cur = path.points[idx]
        const prev = path.points[idx - 1]
        const next = path.points[idx + 1]
        if (cur && cur.x > clampedX && prev) {
          const denom = cur.x - prev.x
          if (denom !== 0) {
            const t = (cur.x - clampedX) / denom
            adjustedPointX = prev.originalX * t + pointX * (1 - t)
          }
        } else if (cur && next) {
          const denom = next.x - cur.x
          if (denom !== 0) {
            const t = (clampedX - cur.x) / denom
            adjustedPointX = next.originalX * t + pointX * (1 - t)
          }
        }

        const dataIndex = least(path.data.length, (i) => {
          const d = path.data[i]
          return Math.abs((d ? d.x : 0) - adjustedPointX)
        })
        const safeIndex = Math.max(0, Math.min(dataIndex, path.data.length - 1))
        const d = path.data[safeIndex]
        if (d) {
          originalX.value = d.x.toString()
          originalY.value = d.y.toString()
        }
      },
      [currentPath, positionX, positionY, originalX, originalY, chartPathWidth]
    )

    const handleMove = useCallback(
      (e: React.MouseEvent | React.PointerEvent) => {
        if (!gestureEnabled) return
        if (!currentPath) return
        const target = e.currentTarget as unknown as HTMLElement
        const rect = target.getBoundingClientRect()
        const mouseEvent = e as React.MouseEvent
        const clientX: number = typeof mouseEvent.clientX === 'number' ? mouseEvent.clientX : 0
        const clientY: number = typeof mouseEvent.clientY === 'number' ? mouseEvent.clientY : 0
        const x = clientX - rect.left
        const y = clientY - rect.top
        if (!isActive.value) {
          isActive.value = true
        }
        updatePosition(x, y)
      },
      [gestureEnabled, currentPath, isActive, updatePosition]
    )

    const handleLeave = useCallback(() => {
      resetGestureState()
    }, [resetGestureState])

    const pathD = useMemo(() => currentPath?.path ?? '', [currentPath?.path])
    const finalStroke = stroke ?? ctxStroke

    return (
      <View
        style={{ height, width }}
        ref={containerRef}
        onMouseMove={handleMove}
        onMouseDown={handleMove}
        onMouseUp={handleLeave}
        onMouseLeave={handleLeave}
      >
        {pathD ? (
          <Svg style={{ height, width }} viewBox={`0 0 ${width} ${height}`}>
            <Path
              d={pathD}
              stroke={finalStroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              {...rest}
            />
          </Svg>
        ) : null}
      </View>
    )
  }
)

ChartPath.displayName = 'ChartPath'
