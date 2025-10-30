import type { ViewStyle } from '@tamagui/core'
import { useEffect, useState } from 'react'
import { Animated, type ViewStyle as RNViewStyle } from 'react-native'

export const Shake = ({
  shakeKey,
  shakeTimes = 4,
  shakeDistance = 5,
  children,
  baseStyle = {},
}: {
  shakeKey?: string
  shakeTimes?: number
  shakeDistance?: number
  children: React.ReactNode
  baseStyle?: Omit<ViewStyle, 'transform'>
}) => {
  const [translateX] = useState(new Animated.Value(0))

  useEffect(() => {
    if (!shakeKey) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 10,
        useNativeDriver: true,
      }).start()
    } else {
      const animations = Array.from(Array(shakeTimes)).map((_, idx, arr) => {
        const value =
          idx + 1 === arr.length ? 0 : (idx + 1) % 2 === 0 ? -shakeDistance : shakeDistance
        return Animated.timing(translateX, {
          toValue: value,
          duration: 10,
          delay: 10 * idx,
          useNativeDriver: true,
        })
      })

      Animated.sequence(animations).start()
    }
  }, [shakeDistance, shakeKey, shakeTimes, translateX])

  return (
    <Animated.View
      style={
        {
          ...(baseStyle as RNViewStyle),
          transform: [{ translateX }],
        } as RNViewStyle
      }
    >
      {children}
    </Animated.View>
  )
}
