import { IconArrowUp, IconChart, IconClock, IconCompass, IconHome } from 'app/components/icons'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'
import { BottomNavBarContent } from 'app/components/BottomTabBar/BottomNavBarContent'
import { Animated, StyleSheet } from 'react-native'
import { useEffect, useRef } from 'react'
import { useMedia } from '@my/ui'

export const TABS = [
  {
    Icon: IconHome,
    href: '/',
    key: 'index',
  },
  {
    Icon: IconClock,
    href: '/activity',
    key: 'activity',
  },
  {
    Icon: IconArrowUp,
    href: '/send',
    key: 'send',
  },
  {
    Icon: IconChart,
    href: '/trade',
    key: 'trade',
  },
  {
    Icon: IconCompass,
    href: '/explore',
    key: 'explore',
  },
]

function BottomNavBar({ currentRoute }: { currentRoute: string }) {
  const { direction } = useScrollDirection()
  const { height } = useTabBarSize()
  const translateY = useRef(new Animated.Value(0)).current
  const prevDirectionRef = useRef(direction)
  const media = useMedia()

  useEffect(() => {
    const prevDirection = prevDirectionRef.current
    const changedToDown = prevDirection === 'up' && direction === 'down'
    const changedToUp = prevDirection === 'down' && direction === 'up'
    const shouldAnimate = changedToDown || changedToUp

    if (shouldAnimate) {
      Animated.timing(translateY, {
        toValue: changedToDown ? height : 0,
        duration: 200,
        useNativeDriver: false, // Can't use native driver for web
      }).start()
    }

    prevDirectionRef.current = direction
  }, [direction, translateY, height])

  // Hide on large screens
  if (media.gtLg) {
    return null
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: height,
          transform: [{ translateY }],
        },
      ]}
    >
      <BottomNavBarContent tabs={TABS} currentRoute={currentRoute} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    // @ts-expect-error - position: 'fixed' is valid on web via react-native-web but not in RN types
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
})

BottomNavBar.displayName = 'BottomNavBar'

export default BottomNavBar
