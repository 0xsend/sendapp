import { Container, YStack } from '@my/ui'
import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenContentContainerProps {
  children: ReactNode
}

export function ScreenContentContainer({ children }: ScreenContentContainerProps) {
  const { bottom } = useSafeAreaInsets()

  return (
    <Container f={1} backgroundColor="$background">
      <YStack f={1} pb={bottom} px="$4">
        {children}
      </YStack>
    </Container>
  )
}
