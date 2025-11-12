import { IconArrowUp, IconClock, IconCompass, IconHome } from 'app/components/icons'
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
    href: '/(tabs)/home',
    key: 'home/index',
  },
  {
    Icon: IconClock,
    href: '/(tabs)/activity',
    key: 'activity/index',
  },
  {
    Icon: IconArrowUp,
    href: `/(tabs)/send?${new URLSearchParams({ sendToken: sendTokenAddress[baseMainnet.id] })}`,
    key: 'send/index',
  },
  {
    Icon: IconCompass,
    href: '/(tabs)/explore',
    key: 'explore/index',
  },
]

function BottomNavBar({ currentRoute }: { currentRoute: string }) {
  const segments = useSegments()
  const { direction } = useScrollDirection()
  const translateY = useRef(new Animated.Value(0)).current
  const prevDirectionRef = useRef(direction)
  const prevRouteRef = useRef(currentRoute)
  const { height } = useTabBarSize()

  // Handle both route changes and scroll-based animation
  useEffect(() => {
    const isInTabsRoute = segments.includes('(tabs)')
    const routeChanged = prevRouteRef.current !== currentRoute

    // Priority 1: Reset to visible when route changes
    if (routeChanged && isInTabsRoute) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
      prevRouteRef.current = currentRoute
      prevDirectionRef.current = direction
      return
    }

    // Priority 2: Handle scroll-based hide/show
    const prevDirection = prevDirectionRef.current
    const changedToDown = prevDirection === 'up' && direction === 'down'
    const changedToUp = prevDirection === 'down' && direction === 'up'
    const shouldAnimate = isInTabsRoute && (changedToDown || changedToUp)

    if (shouldAnimate) {
      Animated.timing(translateY, {
        toValue: changedToDown ? height : 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }

    prevDirectionRef.current = direction
    prevRouteRef.current = currentRoute
  }, [currentRoute, direction, translateY, segments, height])

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

BottomNavBar.displayName = 'BottomNavBar.native'

export default BottomNavBar
