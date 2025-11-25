import { IconArrowUp, IconChart, IconClock, IconCompass, IconHome } from 'app/components/icons'
import { Portal, XStack } from '@my/ui'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'
import { BottomNavBarContent } from 'app/components/BottomTabBar/BottomNavBarContent'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export const TABS = [
  {
    Icon: IconHome,
    href: '/',
    key: 'index',
    labelKey: 'tabs.home',
  },
  {
    Icon: IconClock,
    href: '/activity',
    key: 'activity',
    labelKey: 'tabs.activity',
  },
  {
    Icon: IconArrowUp,
    href: '/send',
    key: 'send',
    labelKey: 'tabs.send',
  },
  {
    Icon: IconChart,
    href: '/trade',
    key: 'trade',
    labelKey: 'tabs.trade',
  },
  {
    Icon: IconCompass,
    href: '/explore',
    key: 'explore',
    labelKey: 'tabs.explore',
  },
]

function BottomNavBar({ currentRoute }: { currentRoute: string }) {
  const { direction } = useScrollDirection()
  const { height } = useTabBarSize()
  const { t } = useTranslation('navigation')

  const translatedTabs = useMemo(
    () =>
      TABS.map((tab) => ({
        ...tab,
        label: t(tab.labelKey),
      })),
    [t]
  )

  return (
    <Portal>
      <XStack
        $platform-web={{
          position: 'fixed',
        }}
        pe="auto"
        bottom={direction === 'down' ? -height : 0}
        left={0}
        right={0}
        zIndex={100}
        height={height}
        animation="200ms"
        animateOnly={['bottom']}
        $gtLg={{ display: 'none' }}
      >
        <BottomNavBarContent tabs={translatedTabs} currentRoute={currentRoute} />
      </XStack>
    </Portal>
  )
}

BottomNavBar.displayName = 'BottomNavBar'

export default BottomNavBar
