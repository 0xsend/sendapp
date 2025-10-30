import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native'
import { styled, useWindowDimensions, View } from 'tamagui'
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
    speed = 1,
    delay = 0,
    disableAnimation = false,
    scope = 'global',
    ...rest
  }: ShimmerProps) => {
    const shimmer = useShimmer()
    const animatedValue = useRef(new Animated.Value(0)).current

    const [offset, setOffset] = useState(0)
    const [componentWidth, setComponentWidth] = useState(0)

    const [_renderGradient, setRenderGradient] = useState(false)
    const renderGradient = useDeferredValue(_renderGradient)

    useEffect(() => {
      setRenderGradient(true)
    }, [])

    // Start animation when component mounts
    useEffect(() => {
      if (!disableAnimation && renderGradient) {
        let isCancelled = false

        const startAnimation = () => {
          if (isCancelled) return
          animatedValue.setValue(0)
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2500 / speed,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished && !isCancelled) {
              startAnimation()
            }
          })
        }

        if (delay > 0) {
          const timeout = setTimeout(startAnimation, delay)
          return () => {
            isCancelled = true
            clearTimeout(timeout)
            animatedValue.stopAnimation()
          }
        }
        startAnimation()
        return () => {
          isCancelled = true
          animatedValue.stopAnimation()
        }
      }
    }, [animatedValue, disableAnimation, renderGradient, speed, delay])

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

    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange:
        scope === 'local'
          ? [-componentWidth, componentWidth]
          : [-(componentWidth + offset), screenWidth + componentWidth],
    })

    return (
      <ShimmerFrame onLayout={measure} {...rest}>
        {renderGradient && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: componentWidth ? 1 : 0,
                transform: [{ translateX }],
              },
            ]}
          >
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
