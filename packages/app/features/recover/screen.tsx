import { Container, YStack } from '@my/ui'
import { useMemo } from 'react'
import { Paragraph } from '@my/ui/index'

export function ChallengeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return useMemo(
    () => (
      <Paragraph>
        <Container height={'100%'} $sm={{ px: '$4' }}>
          <YStack h={'100%'} f={1}>
            {children}
          </YStack>
        </Container>
      </Paragraph>
    ),
    [children]
  )
}
