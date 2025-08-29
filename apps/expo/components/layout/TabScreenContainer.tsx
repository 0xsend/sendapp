import { Container, ScrollView } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useIsFocused } from '@react-navigation/native'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'

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
          paddingBottom: height,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={128}
        bounces={true}
        overScrollMode="never" // Android scroll indicator
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
