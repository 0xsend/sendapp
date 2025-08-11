import { YStack } from 'tamagui'
import BottomNavBar, { TABS } from 'app/components/BottomTabBar/BottomNavBar'
import { Container } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { usePathname } from 'app/utils/usePathname'

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

  return (
    <YStack f={1}>
      {children}
      <Container>
        <BottomNavBar currentRoute={getCurrentRoute()} />
      </Container>
    </YStack>
  )
}
