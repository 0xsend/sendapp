import { YStack } from 'tamagui'
import { BottomNavBar } from 'app/components/BottomTabBar/BottomNavBar'
import { Container } from '@my/ui'
import type { PropsWithChildren } from 'react'

export const BottomNavBarWrapper = ({ children }: PropsWithChildren) => {
  return (
    <YStack f={1}>
      {children}
      <Container>
        <BottomNavBar />
      </Container>
    </YStack>
  )
}
