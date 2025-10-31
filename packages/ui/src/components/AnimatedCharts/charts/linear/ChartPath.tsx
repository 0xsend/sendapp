import React, { useCallback, useEffect, useMemo } from 'react'
import { Platform, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  FadeIn,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  type WithSpringConfig,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated'
import Svg, { Path, type PathProps } from 'react-native-svg'
import type { ChartData, PathData } from '../../helpers/ChartContext'
import { useChartData } from '../../helpers/useChartData'

// These not being set to 0 makes it harder to reason about the chart height, and I cannot see any difference when they are set to 0. Keeping in place in case it is needed for some reason.
export const FIX_CLIPPED_PATH_MAGIC_NUMBER = 0 // 22
export const FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER = 0 // 3

// Extra vertical hit area (in px) to make scrubbing more forgiving without affecting layout
const EXTRA_VERTICAL_HITSLOP = 24

function least(length: number, compare: (value: number) => number) {
  'worklet'

  let bound1 = 0
  let bound2 = length - 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pivot = Math.round(bound1 + (bound2 - bound1) / 2)
    if (bound1 === bound2) {
      return bound1
    }
    const areTwoLeft = bound2 === bound1 + 1
    if (compare(pivot - 1) - compare(pivot) > 0) {
      // decreasing, dip on the right side decreasing, dip on the right side
      if (areTwoLeft) {
        return pivot
      }
      bound1 = pivot
    } else {
      // non-increasing or dip, dip on the left side or in pivot non-increasing or dip, dip on the left side or in pivot
      bound2 = pivot
      if (areTwoLeft) {
        return pivot - 1
      }
    }
  }
}

const timingFeedbackDefaultConfig = {
  duration: 80,
}

export const timingAnimationDefaultConfig = {
  duration: 300,
}

const AnimatedPath = Animated.createAnimatedComponent(Path)

type GH2HitSlop = number | Partial<{ left: number; right: number; top: number; bottom: number }>

interface GH2HandlerProps {
  hitSlop?: GH2HitSlop
  shouldCancelWhenOutside?: boolean
  nativeScrollGesture?: ReturnType<typeof Gesture.Native>
}

interface ChartPathProps extends PathProps {
  hapticsEnabled?: boolean
  hitSlop?: number
  fill?: string
  height: number
  stroke?: string
  width: number
  strokeWidth?: number
  selectedStrokeWidth?: number
  gestureEnabled?: boolean
  springConfig?: WithSpringConfig
  // On native GH2, we will map the few supported keys from this object (hitSlop, shouldCancelWhenOutside)
  panGestureHandlerProps?: Record<string, unknown>
  timingFeedbackConfig?: WithTimingConfig
  timingAnimationConfig?: WithTimingConfig
  isCard?: boolean
  // Swallowed on native to avoid forwarding to AnimatedPath; used only on web
  onScrub?: unknown
}

function positionXWithMargin(x: number, margin: number, width: number) {
  'worklet'
  if (x < margin) {
    return Math.max(3 * x - 2 * margin, 0)
  }
  if (width - x < margin) {
    return Math.min(margin + x * 2 - width, width)
  }
  return x
}

// Optional haptics shim (no-op if not provided by host app)
const triggerHaptics = (_type: string) => {}

const IS_ANDROID = Platform.OS === 'android'
const IS_IOS = Platform.OS === 'ios'

// Local helper to approximate y for a given x using linear interpolation on path points
function getYForXFromPoints(points: { x: number; y: number }[], x: number): number | null {
  'worklet'
  if (!points || points.length === 0) return null
  // Ensure monotonic by x assumption (our provider sorts by x)
  const first = points[0]
  if (!first) return null
  if (x <= first.x) return first.y
  const last = points[points.length - 1]
  if (!last) return null
  if (x >= last.x) return last.y
  // Find bracketing segment
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

const ChartPathInner = React.memo(
  ({
    hitSlop = 0,
    stroke = 'black',
    selectedStroke = 'blue',
    strokeWidth = 1,
    selectedStrokeWidth = 1,
    gestureEnabled = true,
    hapticsEnabled,
    width,
    height,
    containerWidth,
    timingFeedbackConfig,
    timingAnimationConfig,
    panGestureHandlerProps,
    positionX,
    positionY,
    originalX,
    originalY,
    state,
    isActive,
    progress,
    currentPath,
    previousPath,
    isCard,
    ...props
  }: ChartPathProps &
    Omit<ChartData, 'data' | 'dotScale' | 'color'> & { containerWidth: number }) => {
    ChartPathInner.displayName = 'chartPathInner'
    const selectedStrokeProgress = useSharedValue(0)
    // Hold-to-activate (native): gate scrubbing with GH2 long press
    // Shared state for GH2 gestures
    const armed = useSharedValue(false) // becomes true after long-press starts
    const didPan = useSharedValue(false)
    const panBegan = useSharedValue(false)
    // Capture initial press location so we can show indicator on hold
    const pressX = useSharedValue(0)
    const pressY = useSharedValue(0)
    const strokeColorAnimated = useDerivedValue(() => {
      return interpolateColor(selectedStrokeProgress.value, [0, 1], [stroke, selectedStroke])
    }, [selectedStrokeProgress, stroke, selectedStroke])
    const strokeWidthAnimated = useDerivedValue(() => {
      return interpolate(selectedStrokeProgress.value, [0, 1], [strokeWidth, selectedStrokeWidth])
    }, [selectedStrokeProgress, strokeWidth, selectedStrokeWidth])

    useAnimatedReaction(
      () => isActive.value,
      (isActive) => {
        if (isActive) {
          selectedStrokeProgress.value = withTiming(
            1,
            timingFeedbackConfig || timingFeedbackDefaultConfig
          )
        } else {
          selectedStrokeProgress.value = withTiming(
            0,
            timingFeedbackConfig || timingFeedbackDefaultConfig
          )
        }
      },
      [isActive, selectedStrokeProgress, timingFeedbackConfig]
    )

    const setOriginData = useCallback(
      (path: PathData, index?: number) => {
        'worklet'
        if (!path.data.length) {
          return
        }

        if (typeof index === 'undefined') {
          originalX.value = ''
          originalY.value = ''
          return
        }

        const safeIndex = Math.max(0, Math.min(index, path.data.length - 1))
        const d = path.data[safeIndex]
        if (!d) return
        originalX.value = d.x.toString()
        originalY.value = d.y.toString()
      },
      [originalX, originalY]
    )

    useEffect(() => {
      // On dataset/timeframe change, clear any active scrubbing and reset origins
      armed.value = false
      didPan.value = false
      panBegan.value = false
      isActive.value = false
      positionY.value = -1
      originalX.value = ''
      originalY.value = ''
      if (currentPath) {
        setOriginData(currentPath)
      }
    }, [
      currentPath,
      setOriginData,
      isActive,
      positionY,
      originalX,
      originalY,
      armed,
      didPan,
      panBegan,
    ])

    const updatePosition = useCallback(
      ({ x, y }: { x: number | null; y: number | null }) => {
        'worklet'
        if (
          !currentPath ||
          currentPath.points.length === 0 ||
          progress.value === 0 ||
          x === null ||
          y === null
        ) {
          return
        }

        const yForX = getYForXFromPoints(currentPath.points, x)

        if (yForX !== null) {
          positionY.value = yForX
        }

        positionX.value = x

        // refer to this article for more details about this code
        // https://observablehq.com/@d3/multi-line-chart
        const index = least(currentPath.points.length, (i) => {
          if (typeof i === 'undefined' || x === null) {
            return 0
          }
          const p = currentPath.points[i]
          return Math.abs((p ? p.x : 0) - x)
        })

        const idx = Math.max(0, Math.min(index, currentPath.points.length - 1))
        const basePoint = currentPath.points[idx]
        const pointX = basePoint ? basePoint.originalX : (currentPath.data[0]?.x ?? 0)

        let adjustedPointX: number = pointX
        const cur = currentPath.points[idx]
        const prev = currentPath.points[idx - 1]
        const next = currentPath.points[idx + 1]
        if (cur && cur.x > x && prev) {
          const prevPointOriginalX = prev.originalX
          const denom = cur.x - prev.x
          if (denom !== 0) {
            const distance = (cur.x - x) / denom
            adjustedPointX = prevPointOriginalX * distance + pointX * (1 - distance)
          }
        } else if (cur && next) {
          const nextPointOriginalX = next.originalX
          const denom = next.x - cur.x
          if (denom !== 0) {
            const distance = (x - cur.x) / denom
            adjustedPointX = nextPointOriginalX * distance + pointX * (1 - distance)
          }
        }

        const dataIndex = least(currentPath.data.length, (i) => {
          if (typeof i === 'undefined' || x === null) {
            return 0
          }
          const d = currentPath.data[i]
          return Math.abs((d ? d.x : 0) - adjustedPointX)
        })

        setOriginData(currentPath, dataIndex)
      },
      [currentPath, positionX, positionY, progress, setOriginData]
    )

    // Show indicator as soon as long-press starts (armed)
    useAnimatedReaction(
      () => armed.value,
      (armedNow) => {
        if (armedNow) {
          if (!isActive.value) {
            isActive.value = true
            if (hapticsEnabled) runOnJS(triggerHaptics)('soft')
          }
          updatePosition({ x: pressX.value, y: pressY.value })
        }
      },
      [armed, isActive, hapticsEnabled, updatePosition, pressX, pressY]
    )

    const resetGestureState = useCallback(() => {
      'worklet'
      // Clear indicator and scrub state
      armed.value = false
      didPan.value = false
      panBegan.value = false
      originalX.value = ''
      originalY.value = ''
      positionY.value = -1
      isActive.value = false
      updatePosition({ x: null, y: null })
    }, [originalX, originalY, positionY, isActive, updatePosition, armed, didPan, panBegan])

    const animatedProps = useAnimatedProps(() => {
      if (!currentPath) {
        return {
          d: '',
          strokeWidth,
          stroke,
        }
      }

      return {
        d: currentPath.path,
        strokeWidth: strokeWidthAnimated.value,
        stroke: strokeColorAnimated.value,
      }
    }, [currentPath, strokeWidth, stroke, strokeWidthAnimated, strokeColorAnimated])

    // Map wrapper props to GH2 (hitSlop, shouldCancelWhenOutside)
    const handlerProps = (panGestureHandlerProps ?? {}) as GH2HandlerProps
    const externalHitSlop = handlerProps.hitSlop
    const externalShouldCancel = handlerProps.shouldCancelWhenOutside ?? true
    const externalNativeGesture = handlerProps.nativeScrollGesture

    const panHitSlop = useMemo(
      () =>
        (externalHitSlop as unknown) ?? {
          // Default conservatively: do not expand vertical hit area so scroll remains responsive.
          // Callers (e.g., ChartLineSection) can opt-in to vertical padding via panGestureHandlerProps.
          left: hitSlop,
          right: hitSlop,
        },
      [externalHitSlop, hitSlop]
    )

    const nativeGesture = useMemo(() => {
      const g = externalNativeGesture as ReturnType<typeof Gesture.Native> | null
      return (g as ReturnType<typeof Gesture.Native>) || Gesture.Native()
    }, [externalNativeGesture])

    const longPressGesture = useMemo(() => {
      let lg = Gesture.LongPress()
        .minDuration(500)
        .maxDistance(4)
        .hitSlop(panHitSlop as GH2HitSlop)
        .shouldCancelWhenOutside(externalShouldCancel)
        .simultaneousWithExternalGesture(nativeGesture)

      lg = lg
        .onBegin((e) => {
          'worklet'
          state.value = 1
          pressX.value = positionXWithMargin(e.x, hitSlop, width)
          pressY.value = e.y
        })
        .onStart((e) => {
          'worklet'
          // Arm and show indicator immediately at press
          armed.value = true
          isActive.value = true
          pressX.value = positionXWithMargin(e.x, hitSlop, width)
          pressY.value = e.y
          updatePosition({ x: pressX.value, y: pressY.value })
          if (hapticsEnabled) runOnJS(triggerHaptics)('soft')
        })
        .onFinalize(() => {
          'worklet'
          // If user releases without panning, reset
          if (!panBegan.value) {
            resetGestureState()
          }
        })

      return lg
    }, [
      panHitSlop,
      externalShouldCancel,
      hitSlop,
      width,
      hapticsEnabled,
      state,
      pressX,
      pressY,
      armed,
      isActive,
      updatePosition,
      resetGestureState,
      panBegan,
      nativeGesture,
    ])

    const panGesture = useMemo(() => {
      let pg = Gesture.Pan()
        // Require meaningful horizontal movement
        .minDistance(8)
        .activeOffsetX([-8, 8])
        .hitSlop(panHitSlop as GH2HitSlop)
        .shouldCancelWhenOutside(externalShouldCancel)
        .simultaneousWithExternalGesture(nativeGesture)

      pg = pg
        .onBegin((_e) => {
          'worklet'
          didPan.value = false
          panBegan.value = true
        })
        .onUpdate((e) => {
          'worklet'
          if (!armed.value || !isActive.value) return
          didPan.value = true
          updatePosition({ x: positionXWithMargin(e.x, hitSlop, width), y: e.y })
        })
        .onFinalize(() => {
          'worklet'
          resetGestureState()
        })

      return pg
    }, [
      panHitSlop,
      externalShouldCancel,
      armed,
      isActive,
      updatePosition,
      hitSlop,
      width,
      didPan,
      panBegan,
      resetGestureState,
      nativeGesture,
    ])

    const composedGesture = useMemo(
      () => Gesture.Simultaneous(longPressGesture, panGesture),
      [longPressGesture, panGesture]
    )

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View>
          <Svg
            style={{
              height:
                height +
                (isCard ? FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER : FIX_CLIPPED_PATH_MAGIC_NUMBER),
              width: containerWidth,
            }}
            viewBox={`0 0 ${containerWidth} ${height}`}
          >
            <AnimatedPath
              animatedProps={animatedProps}
              strokeLinecap="round"
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...props}
            />
          </Svg>
        </Animated.View>
      </GestureDetector>
    )
  }
)

export const ChartPath = React.memo(
  ({
    hapticsEnabled,
    width,
    height,
    hitSlop,
    selectedStrokeWidth,
    strokeWidth,
    gestureEnabled,
    timingFeedbackConfig,
    timingAnimationConfig,
    panGestureHandlerProps = {},
    isCard = false,
    onScrub: _onScrubIgnored,
    ...props
  }: ChartPathProps) => {
    const {
      positionX,
      positionY,
      originalX,
      originalY,
      state,
      isActive,
      progress,
      currentPath,
      previousPath,
      stroke,
      width: chartPathWidth,
      selectedStroke,
    } = useChartData()

    return (
      <View style={{ height, width }}>
        {currentPath?.path ? (
          <Animated.View entering={FadeIn.duration(140)}>
            <ChartPathInner
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...{
                ...props,
                currentPath,
                isCard,
                gestureEnabled,
                hapticsEnabled,
                height,
                hitSlop,
                isActive,
                panGestureHandlerProps,
                originalX,
                originalY,
                positionX,
                positionY,
                previousPath,
                progress,
                selectedStrokeWidth,
                state,
                stroke,
                selectedStroke,
                strokeWidth,
                timingAnimationConfig,
                timingFeedbackConfig,
                width: chartPathWidth,
                containerWidth: width,
              }}
            />
          </Animated.View>
        ) : null}
      </View>
    )
  }
)

ChartPath.displayName = 'ChartPath'
