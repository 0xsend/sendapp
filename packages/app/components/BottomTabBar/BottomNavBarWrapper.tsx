import { YStack } from 'tamagui'
import BottomNavBar, { TABS } from 'app/components/BottomTabBar/BottomNavBar'
import { Container } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { usePathname } from 'app/utils/usePathname'

const HIDDEN_NAVBAR_ROUTES = ['/rewards'] as const

export const BottomNavBarWrapper = ({ children }: PropsWithChildren) => {
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)

  const getCurrentRoute = (): string => {
    const activeTab = TABS.find((tab) => {
      return (
        location === tab.href.toString() ||
        parts.includes(tab.href.toString()) ||
        tab.href.toString().startsWith(`/${parts[0]}`)
      )
    })

    return activeTab?.key || 'index'
  }

  const shouldShowNavBar = !HIDDEN_NAVBAR_ROUTES.some((route) => location === route)

  return (
    <YStack f={1}>
      {children}
      {shouldShowNavBar && (
        <Container>
          <BottomNavBar currentRoute={getCurrentRoute()} />
        </Container>
      )}
    </YStack>
  )
}
