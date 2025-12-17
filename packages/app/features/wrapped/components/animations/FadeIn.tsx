import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { Stack, type StackProps } from '@my/ui'

export interface FadeInProps extends Omit<StackProps, 'animation'> {
  /**
   * Animation duration in milliseconds
   * @default 3000
   */
  duration?: number
  /**
   * Delay before animation starts in milliseconds
   * @default 0
   */
  delay?: number
  /**
   * Children to render inside the fade-in wrapper
   */
  children?: React.ReactNode
}

/**
 * FadeIn component (Web version)
 *
 * A simple wrapper component that animates its children with a fade-in effect.
 * Supports controllable animation speed and delay.
 * Uses CSS transitions for smooth web animations.
 *
 * @example
 * ```tsx
 * <FadeIn duration={500} delay={200}>
 *   <Text>This text will fade in</Text>
 * </FadeIn>
 * ```
 */
export function FadeIn({ duration = 3000, delay = 0, children, ...stackProps }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start()
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, duration, opacity])

  return (
    <Animated.View style={{ opacity }}>
      <Stack {...stackProps}>{children}</Stack>
    </Animated.View>
  )
}
