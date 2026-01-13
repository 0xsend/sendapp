import { useEffect } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { XStack, type XStackProps } from 'tamagui'

interface BlinkingSkeletonProps extends XStackProps {
  minOpacity?: number
  maxOpacity?: number
  duration?: number
}

const AnimatedXStack = Animated.createAnimatedComponent(XStack)

export const BlinkingSkeleton = ({
  minOpacity = 0.2,
  maxOpacity = 0.7,
  duration = 1500,
  children,
  ...props
}: BlinkingSkeletonProps) => {
  const opacity = useSharedValue(minOpacity)

  useEffect(() => {
    opacity.value = minOpacity
    opacity.value = withRepeat(
      withTiming(maxOpacity, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
  }, [opacity, minOpacity, maxOpacity, duration])

  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    return {
      opacity: opacity.value,
    }
  }, [opacity])

  return (
    <AnimatedXStack {...props} style={animatedStyle}>
      {children}
    </AnimatedXStack>
  )
}
