import { Container, ScrollView, View, useSafeAreaInsets } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { ScrollGestureProvider } from '@my/ui/src/gestures/ScrollGestureContext'

export const CONTAINER_OFFSET = 10

interface ScreenContainerProps extends PropsWithChildren {
  /**
   * Whether the container should scroll.
   * Set to false for screens with their own FlatList/VirtualizedList.
   * @default true
   */
  scrollable?: boolean
}

export const ScreenContainer = ({ children, scrollable = true }: ScreenContainerProps) => {
  const insets = useSafeAreaInsets()

  // Non-scrollable: simple View without gesture wrapper (child FlatList handles its own gestures)
  if (!scrollable) {
    return (
      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
      >
        <View
          flex={1}
          flexGrow={1}
          pt={CONTAINER_OFFSET}
          pb={CONTAINER_OFFSET + insets.bottom}
          overflow="visible"
        >
          {children}
        </View>
      </Container>
    )
  }

  // Scrollable: ScrollView with gesture coordination
  const native = Gesture.Native()
  return (
    <Container
      safeAreaProps={{
        edges: ['left', 'right'],
        style: { flex: 1 },
      }}
      flex={1}
      backgroundColor="$background"
    >
      <ScrollGestureProvider value={native}>
        <GestureDetector gesture={native}>
          <ScrollView
            flex={1}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: CONTAINER_OFFSET,
              paddingBottom: CONTAINER_OFFSET + insets.bottom,
            }}
            showsVerticalScrollIndicator={false}
            overflow={'visible'}
            bounces={true}
            overScrollMode="never" // Android scroll indicator
          >
            {children}
          </ScrollView>
        </GestureDetector>
      </ScrollGestureProvider>
    </Container>
  )
}
