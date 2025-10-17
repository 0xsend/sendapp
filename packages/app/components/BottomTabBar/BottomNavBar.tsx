import {
  IconArrowUp,
  IconChart,
  IconCompass,
  IconDeviceReset,
  IconHome,
} from 'app/components/icons'
import { XStack } from '@my/ui'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'
import { BottomNavBarContent } from 'app/components/BottomTabBar/BottomNavBarContent'

export const TABS = [
  {
    Icon: IconHome,
    href: '/',
    key: 'index',
  },
  {
    Icon: IconDeviceReset,
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

  return (
    <XStack
      $platform-web={{
        position: 'fixed',
      }}
      bottom={direction === 'down' ? -height : 0}
      left={0}
      right={0}
      zIndex={100}
      height={height}
      animation="200ms"
      animateOnly={['bottom']}
      $gtLg={{ display: 'none' }}
    >
      <BottomNavBarContent tabs={TABS} currentRoute={currentRoute} />
    </XStack>
  )
}

BottomNavBar.displayName = 'BottomNavBar'

export default BottomNavBar
