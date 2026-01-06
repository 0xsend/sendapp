import { Container, ScrollView, useEvent } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useIsFocused } from '@react-navigation/native'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'
import { type NativeScrollEvent, type NativeSyntheticEvent, Platform } from 'react-native'

export const TabScreenContainer = ({ children }: PropsWithChildren) => {
  const { onScroll, onContentSizeChange } = useScrollDirection()
  const { height } = useTabBarSize()
  const isFocused = useIsFocused()

  const onScrollProp = useEvent((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isFocused) {
      onScroll(e)
    }
  })

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
        bounces={Platform.OS === 'ios'}
        overScrollMode="never" // Android scroll indicator
        overflow={'visible'}
        removeClippedSubviews={Platform.OS === 'android'}
        onScroll={onScrollProp}
        onContentSizeChange={onContentSizeChange}
      >
        {children}
      </ScrollView>
    </Container>
  )
}
