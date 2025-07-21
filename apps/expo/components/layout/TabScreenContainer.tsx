import { Container, ScrollView } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useTabBarSize } from 'apps-expo/utils/layout/useTabBarSize'
import { useIsFocused } from '@react-navigation/native'

export const CONTAINER_OFFSET = 20

export const TabScreenContainer = ({ children }: PropsWithChildren) => {
  const { onScroll, onContentSizeChange } = useScrollDirection()
  const { height } = useTabBarSize()
  const isFocused = useIsFocused()

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
        scrollEventThrottle={128}
        bounces={true}
        overScrollMode="always" // Android scroll indicator
        overflow={'visible'}
        onScroll={(e) => {
          if (isFocused) {
            onScroll(e)
          }
        }}
        onContentSizeChange={onContentSizeChange}
      >
        {children}
      </ScrollView>
    </Container>
  )
}
