import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import Svg, { Path, type PathProps } from 'react-native-svg'
import { useChartData } from '../../helpers/useChartData'

// Web fallback for ChartPath without Reanimated worklets.
// Implements pointer-based scrubbing using regular React events.

type ChartPathWebProps = PathProps & {
  width: number
  height: number
  stroke?: string
  strokeWidth?: number
  selectedStrokeWidth?: number
  // Native-only prop passed by callers; ignore on web to avoid DOM warnings
  panGestureHandlerProps?: unknown
  gestureEnabled?: boolean
  onScrub?: (payload: { active: boolean; ox?: number; oy?: number }) => void
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
    selectedStrokeWidth: _ignoreSelectedStrokeWidth,
    panGestureHandlerProps: _ignorePanGestureHandlerProps,
    gestureEnabled = true,
    onScrub,
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
    const startXRef = useRef<number | null>(null)
    const startYRef = useRef<number | null>(null)
    // Hold-to-activate state (web: JS timers)
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const holdActiveRef = useRef<boolean>(false)
    const isTouchRef = useRef<boolean>(false)
    const [focused, setFocused] = useState(false)

    const resetGestureState = useCallback(() => {
      // clear any pending hold timer
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
      holdActiveRef.current = false
      setFocused(false)
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
          if (onScrub) {
            onScrub({ active: true, ox: d.x, oy: d.y })
          }
        }
      },
      [currentPath, positionX, positionY, originalX, originalY, chartPathWidth, onScrub]
    )

    const handlePointerDown = useCallback(
      (e: unknown) => {
        if (!gestureEnabled) return
        const evt = e as {
          clientX?: number
          clientY?: number
          currentTarget?: { getBoundingClientRect: () => DOMRect }
          pointerType?: string
          nativeEvent?: { pointerType?: string; touches?: unknown[] }
          touches?: unknown[]
        }
        const target = evt.currentTarget as unknown as HTMLElement
        const rect = target.getBoundingClientRect()
        const cx = typeof evt.clientX === 'number' ? evt.clientX : undefined
        const cy = typeof evt.clientY === 'number' ? evt.clientY : undefined
        if (typeof cx !== 'number' || typeof cy !== 'number') return
        startXRef.current = cx - rect.left
        startYRef.current = cy - rect.top

        // Determine if this is a touch pointer without using any
        type Pointerish = {
          pointerType?: string
          touches?: unknown[]
          nativeEvent?: { pointerType?: string; touches?: unknown[] }
        }
        const evObj = evt as Pointerish
        const ne = evObj.nativeEvent
        const pType =
          typeof ne?.pointerType === 'string'
            ? ne.pointerType
            : typeof evObj.pointerType === 'string'
              ? evObj.pointerType
              : undefined
        const hasTouches = Array.isArray(ne?.touches) || Array.isArray(evObj.touches)
        isTouchRef.current = pType === 'touch' || (!!hasTouches && pType !== 'mouse')
        isTouchRef.current = pType === 'touch' || (!!hasTouches && pType !== 'mouse')

        // For touch: require 500ms hold. For mouse/pen: enable immediately and focus via hover.
        if (isTouchRef.current) {
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
          }
          holdActiveRef.current = false
          setFocused(false)
          holdTimerRef.current = setTimeout(() => {
            holdActiveRef.current = true
            setFocused(true)
          }, 500)
        } else {
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
          }
          holdActiveRef.current = true
          setFocused(true)
        }
      },
      [gestureEnabled]
    )

    const handleMove = useCallback(
      (e: unknown) => {
        if (!gestureEnabled) return
        if (!currentPath) return
        const evt = e as {
          clientX?: number
          clientY?: number
          currentTarget?: { getBoundingClientRect: () => DOMRect }
          preventDefault?: () => void
          nativeEvent?: {
            pageX?: number
            pageY?: number
            touches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>
          }
          touches?: Array<{ clientX?: number; clientY?: number }>
        }
        const target = evt.currentTarget as unknown as HTMLElement
        const rect = target.getBoundingClientRect()
        let clientX: number | undefined
        let clientY: number | undefined
        if (typeof evt.clientX === 'number' && typeof evt.clientY === 'number') {
          clientX = evt.clientX
          clientY = evt.clientY
        } else if (
          evt?.nativeEvent &&
          typeof evt.nativeEvent.pageX === 'number' &&
          typeof evt.nativeEvent.pageY === 'number'
        ) {
          clientX = evt.nativeEvent.pageX
          clientY = evt.nativeEvent.pageY
        } else if (
          evt?.nativeEvent &&
          Array.isArray(evt.nativeEvent.touches) &&
          evt.nativeEvent.touches[0]
        ) {
          const t = evt.nativeEvent.touches[0]
          clientX = (typeof t.clientX === 'number' ? t.clientX : t.pageX) ?? undefined
          clientY = (typeof t.clientY === 'number' ? t.clientY : t.pageY) ?? undefined
        } else if (Array.isArray(evt.touches) && evt.touches[0]) {
          const t = evt.touches[0]
          clientX = t.clientX
          clientY = t.clientY
        }
        if (typeof clientX !== 'number' || typeof clientY !== 'number') {
          return
        }
        const x = clientX - rect.left
        const y = clientY - rect.top
        if (x < 0 || y < 0 || x > width || y > height) {
          return
        }
        // Determine intent: allow vertical scroll if vertical movement dominates.
        const sx = startXRef.current
        const sy = startYRef.current
        // Require hold-to-activate for touch; for mouse/pen, allow immediate scrubbing.
        if (!holdActiveRef.current) {
          // Keep tracking start positions but do not activate (touch only)
          if (startXRef.current == null || startYRef.current == null) {
            startXRef.current = x
            startYRef.current = y
          }
          return
        }

        if (!isActive.value) {
          if (!isTouchRef.current) {
            // Mouse/pen: activate immediately when moving within bounds
            isActive.value = true
          } else {
            // Touch: enforce intent threshold
            if (sx == null || sy == null) {
              startXRef.current = x
              startYRef.current = y
              return
            }
            const dx = Math.abs(x - sx)
            const dy = Math.abs(y - sy)
            if (dy > dx && dy > 8) {
              // vertical intent: let page scroll
              return
            }
            if (dx >= 8 && dx >= dy) {
              isActive.value = true
            } else {
              return
            }
          }
        }
        if (typeof evt.preventDefault === 'function') evt.preventDefault()
        updatePosition(x, y)
      },
      [gestureEnabled, currentPath, isActive, updatePosition, width, height]
    )

    const handleLeave = useCallback(() => {
      resetGestureState()
      startXRef.current = null
      startYRef.current = null
      if (onScrub) onScrub({ active: false })
    }, [resetGestureState, onScrub])

    const pathD = useMemo(() => currentPath?.path ?? '', [currentPath?.path])
    const finalStroke = stroke ?? ctxStroke

    const pointerProps = {
      onPointerDown: handlePointerDown,
      onPointerMove: handleMove,
      onPointerUp: handleLeave,
      onPointerCancel: handleLeave,
      onPointerLeave: handleLeave,
      onPointerEnter: () => {
        if (!isTouchRef.current) setFocused(true)
      },
    } as const

    return (
      <View
        style={[
          { height, width },
          [{ touchAction: 'pan-y' } as unknown as ViewStyle] as unknown as StyleProp<ViewStyle>,
        ]}
        ref={containerRef}
        {...(pointerProps as unknown as React.ComponentProps<typeof View>)}
      >
        {pathD ? (
          <Svg style={{ height, width }} viewBox={`0 0 ${width} ${height}`}>
            <Path
              d={pathD}
              stroke={finalStroke}
              strokeWidth={focused ? (strokeWidth ?? 1) + 1 : strokeWidth}
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
