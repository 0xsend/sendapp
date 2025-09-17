import { Container, ScrollView, useSafeAreaInsets } from '@my/ui'
import type { PropsWithChildren } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { ScrollGestureProvider } from '@my/ui/src/gestures/ScrollGestureContext'

export const CONTAINER_OFFSET = 10

export const ScreenContainer = ({ children }: PropsWithChildren) => {
  const native = Gesture.Native()
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
