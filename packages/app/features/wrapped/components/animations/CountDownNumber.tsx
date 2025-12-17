import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { Paragraph, type ParagraphProps } from '@my/ui'

export interface CountDownNumberProps extends Omit<ParagraphProps, 'children'> {
  /**
   * Target number to count down to
   */
  value: number
  /**
   * Animation duration in milliseconds
   * @default 2000
   */
  duration?: number
  /**
   * Delay before animation starts in milliseconds
   * @default 0
   */
  delay?: number
  /**
   * Number of decimal places to display
   * @default 0
   */
  decimals?: number
  /**
   * Custom formatter function for the number
   * @example (n) => n.toLocaleString()
   */
  formatter?: (value: number) => string
}

/**
 * CountDownNumber component
 *
 * Animates a number from 100,000 down to a target value with a smooth counting effect.
 * Works cross-platform (web and native).
 * Uses React Native Animated API for smooth animations.
 *
 * @example
 * ```tsx
 * <CountDownNumber value={1000} duration={2000} />
 * <CountDownNumber value={42.5} decimals={1} />
 * <CountDownNumber value={5000} formatter={(n) => n.toLocaleString()} />
 * ```
 */
export function CountDownNumber({
  value,
  duration = 2000,
  delay = 0,
  decimals = 0,
  formatter,
  ...paragraphProps
}: CountDownNumberProps) {
  const animatedValue = useRef(new Animated.Value(100000)).current
  const [displayValue, setDisplayValue] = useState('100000')

  useEffect(() => {
    // Reset the animated value to 100,000
    animatedValue.setValue(100000)
    setDisplayValue(formatter ? formatter(100000) : (100000).toFixed(decimals))

    const timer = setTimeout(() => {
      // Add listener to update display value during animation
      const listenerId = animatedValue.addListener(({ value: currentValue }) => {
        const formattedValue = formatter ? formatter(currentValue) : currentValue.toFixed(decimals)
        setDisplayValue(formattedValue)
      })

      // Start animation
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        useNativeDriver: false, // Required for non-transform animations
      }).start()

      // Cleanup listener on unmount
      return () => {
        animatedValue.removeListener(listenerId)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [value, duration, delay, decimals, formatter, animatedValue])

  return <Paragraph {...paragraphProps}>{displayValue}</Paragraph>
}
