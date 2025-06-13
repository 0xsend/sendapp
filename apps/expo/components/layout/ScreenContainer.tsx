import { Container, ScrollView, useSafeAreaInsets } from '@my/ui'
import type { PropsWithChildren } from 'react'

const CONTAINER_OFFSET = 10

export const ScreenContainer = ({ children }: PropsWithChildren) => {
  const insets = useSafeAreaInsets()

  return (
    <Container
      safeAreaProps={{
        edges: ['left', 'right'],
        style: { flex: 1 },
      }}
      flex={1}
      backgroundColor="$background"
    >
      <ScrollView
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: CONTAINER_OFFSET,
          paddingBottom: CONTAINER_OFFSET + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always" // Android scroll indicator
      >
        {children}
      </ScrollView>
    </Container>
  )
}
