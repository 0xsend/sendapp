import { IconArrowUp, IconDeviceReset, IconHome } from 'app/components/icons'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useSegments } from 'expo-router'
import { Animated } from 'react-native'
import { useEffect, useRef } from 'react'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'
import { BottomNavBarContent } from 'app/components/BottomTabBar/BottomNavBarContent'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'

const TABS = [
  {
    Icon: IconHome,
    href: '/(tabs)/',
    key: 'index',
  },
  {
    Icon: IconArrowUp,
    href: `/(tabs)/send?${new URLSearchParams({ sendToken: sendTokenAddress[baseMainnet.id] })}`,
    key: 'send/index',
  },
  {
    Icon: IconDeviceReset,
    href: '/(tabs)/activity',
    key: 'activity/index',
  },
]

export default function BottomNavBar({ currentRoute }: { currentRoute: string }) {
  const segments = useSegments()
  const { direction } = useScrollDirection()
  const translateY = useRef(new Animated.Value(0)).current
  const prevDirectionRef = useRef(direction)
  const { height } = useTabBarSize()

  // Handle scroll-based animation
  useEffect(() => {
    const prevDirection = prevDirectionRef.current
    const changedToDown = prevDirection === 'up' && direction === 'down'
    const changedToUp = prevDirection === 'down' && direction === 'up'
    const isInTabsRoute = segments.includes('(tabs)')
    const shouldAnimate = isInTabsRoute && (changedToDown || changedToUp)

    if (shouldAnimate) {
      Animated.timing(translateY, {
        toValue: changedToDown ? height : 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }

    prevDirectionRef.current = direction
  }, [direction, translateY, segments, height])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: height,
        transform: [{ translateY }],
      }}
    >
      <BottomNavBarContent tabs={TABS} currentRoute={currentRoute} />
    </Animated.View>
  )
}
