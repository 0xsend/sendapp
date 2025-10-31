import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native'
import { styled, useWindowDimensions, View } from 'tamagui'
import Animated, { Easing, useAnimatedStyle, type EasingFunction } from 'react-native-reanimated'
import { useShimmer } from './ShimmerContext'
import { MyLinearGradient } from './LinearGradient'

const LINEAR_GRADIENTS_WHITE = [
  { color: '#fff', opacity: 0 },
  { color: '$gray11', opacity: 0.1 },
  { color: '$gray11', opacity: 0.2 },
  { color: '$gray11', opacity: 0.1 },
  { color: '#fff', opacity: 0 },
]

export function gradientCoordsFromAngle(degrees: number): {
  start: { x: number; y: number }
  end: { x: number; y: number }
} {
  const radians = (degrees * Math.PI) / 180
  const offset = Math.tan(radians) / 2

  return {
    start: { x: 0, y: 0.5 - offset },
    end: { x: 1, y: 0.5 + offset },
  }
}

const DEFAULT_GRADIENT_START = gradientCoordsFromAngle(10).start
const DEFAULT_GRADIENT_END = gradientCoordsFromAngle(10).end

interface ShimmerProps {
  style?: ViewStyle | ViewStyle[]
  linearGradients?: { color: string; opacity: number }[]
  gradientStart?: { x: number; y: number }
  gradientEnd?: { x: number; y: number }
  easing?: EasingFunction
  speed?: number
  delay?: number
  disableAnimation?: boolean
  scope?: 'global' | 'local'
}

const ShimmerFrame = styled(View, {
  name: 'ShimmerFrame',
  overflow: 'hidden',
  position: 'relative',
  height: '100%',
  width: '100%',
  bg: '$aztec4',
  '$theme-light': {
    bg: '$gray2',
  },
})

export const Shimmer = ShimmerFrame.styleable<ShimmerProps>(
  ({
    linearGradients = LINEAR_GRADIENTS_WHITE,
    gradientStart = DEFAULT_GRADIENT_START,
    gradientEnd = DEFAULT_GRADIENT_END,
    easing = Easing.linear,
    speed = 1,
    delay = 0,
    disableAnimation = false,
    scope = 'global',
    ...rest
  }: ShimmerProps) => {
    const shimmer = useShimmer()

    const [offset, setOffset] = useState(0)
    const [componentWidth, setComponentWidth] = useState(0)

    const [_renderGradient, setRenderGradient] = useState(false)
    const renderGradient = useDeferredValue(_renderGradient)

    useEffect(() => {
      setRenderGradient(true)
    }, [])

    useEffect(() => {
      let shimerIncreased = false
      let timer: ReturnType<typeof setTimeout> | null = null
      if (!disableAnimation && renderGradient) {
        if (delay > 0) {
          timer = setTimeout(() => {
            shimerIncreased = true
            shimmer?.increaseActiveShimmers()
          }, delay)
        } else {
          shimerIncreased = true
          shimmer?.increaseActiveShimmers()
        }
      }
      return () => {
        if (timer) {
          clearTimeout(timer)
        }
        if (shimerIncreased) {
          shimmer?.decreaseActiveShimmers()
        }
      }
    }, [shimmer, delay, disableAnimation, renderGradient])

    const measure = useCallback(
      (event: LayoutChangeEvent) => {
        if (componentWidth === 0) {
          const { width, x } = event.nativeEvent.layout
          setComponentWidth(width)
          setOffset(x)
        }
      },
      [componentWidth]
    )

    const { width: screenWidth } = useWindowDimensions()

    const gradientStyle = useAnimatedStyle(() => {
      const localProgress = ((shimmer?.progress?.value ?? 0) * speed) % 1
      const easedProgress = easing(localProgress)

      const remappedRange =
        scope === 'local'
          ? -componentWidth + 2 * componentWidth * easedProgress
          : -(componentWidth + offset) + (screenWidth + componentWidth) * easedProgress

      return {
        opacity: localProgress ? 1 : 0,
        transform: [
          {
            translateX: remappedRange,
          },
        ],
      }
    }, [componentWidth, offset, easing, speed, screenWidth, shimmer, scope])

    return (
      <ShimmerFrame onLayout={measure} {...rest}>
        {renderGradient && (
          <Animated.View style={[gradientStyle, StyleSheet.absoluteFillObject]}>
            <MyLinearGradient
              colors={shimmer?.gradientConfig?.colors ?? linearGradients}
              start={shimmer?.gradientConfig?.start ?? gradientStart}
              end={shimmer?.gradientConfig?.end ?? gradientEnd}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </ShimmerFrame>
    )
  }
)
