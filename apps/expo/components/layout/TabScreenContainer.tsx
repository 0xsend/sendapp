import { Container, ScrollView } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useTabBarSize } from 'apps-expo/utils/layout/useTabBarSize'

const CONTAINER_OFFSET = 20

export const TabScreenContainer = ({ children }: PropsWithChildren) => {
  const { onScroll } = useScrollDirection()
  const { height } = useTabBarSize()

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
          paddingBottom: height + CONTAINER_OFFSET,
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always" // Android scroll indicator
        overflow={'visible'}
        onScroll={onScroll}
      >
        {children}
      </ScrollView>
    </Container>
  )
}
