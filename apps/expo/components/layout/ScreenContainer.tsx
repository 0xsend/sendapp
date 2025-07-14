import { Container, ScrollView, useSafeAreaInsets } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'

const CONTAINER_OFFSET = 10

export const ScreenContainer = ({ children }: PropsWithChildren) => {
  const insets = useSafeAreaInsets()
  const { onContentSizeChange, ref, onScroll } = useScrollDirection()

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
        ref={ref}
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: CONTAINER_OFFSET,
          paddingBottom: CONTAINER_OFFSET + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        overflow={'visible'}
        bounces={true}
        overScrollMode="always" // Android scroll indicator
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={128}
      >
        {children}
      </ScrollView>
    </Container>
  )
}
