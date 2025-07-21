import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
} from 'react-native'
import { createContext, type RefObject, useContext } from 'react'

export type ScrollDirectionContextValue = {
  direction: 'up' | 'down' | null
  isAtEnd: boolean
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>, threshold?: number) => void
  onContentSizeChange: ScrollViewProps['onContentSizeChange']
  ref: RefObject<ScrollView>
}

export const ScrollDirection = createContext<ScrollDirectionContextValue>(
  undefined as unknown as ScrollDirectionContextValue
)

export const useScrollDirection = () => {
  const context = useContext(ScrollDirection)
  if (!context) {
    throw new Error('useScrollDirection must be used within a ScrollDirectionProvider')
  }
  return context
}
