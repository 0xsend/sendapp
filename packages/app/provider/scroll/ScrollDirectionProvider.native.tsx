import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
} from 'react-native'
import { Dimensions } from 'react-native'

export type ScrollDirectionContextValue = {
  direction: 'up' | 'down' | null
  isAtEnd: boolean
  onScroll: ScrollViewProps['onScroll']
  onContentSizeChange: ScrollViewProps['onContentSizeChange']
  ref: React.RefObject<ScrollView>
}

const ScrollDirection = createContext<ScrollDirectionContextValue>(
  undefined as unknown as ScrollDirectionContextValue
)

const THRESHOLD = 50

export const ScrollDirectionProvider = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<ScrollView>(null)

  // Get window dimensions
  const windowHeight = Dimensions.get('window').height

  // Refs for performance-critical values
  const contentOffsetRef = useRef(0)

  // State for UI updates
  const [direction, setDirection] = useState<ScrollDirectionContextValue['direction']>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)
  const [isAtEnd, setIsAtEnd] = useState(false)

  // Callback for content size change
  const onContentSizeChange = useCallback(
    (w: number, height: number) => {
      setContentHeight(height)
      setIsAtEnd(height <= windowHeight)
    },
    [windowHeight]
  )

  // Scroll event handler
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = e.nativeEvent
      const contentOffsetY = contentOffset.y

      // Determine scroll direction
      if (contentOffsetY < THRESHOLD) {
        setDirection('up')
      } else if (contentOffsetRef.current - contentOffsetY > THRESHOLD && !isAtEnd) {
        setDirection('up')
      } else if (contentOffsetY - contentOffsetRef.current > THRESHOLD || isAtEnd) {
        setDirection('down')
      }

      // Update last scroll position
      contentOffsetRef.current = contentOffsetY

      // Check if at the end of content
      const isScrollAtEnd =
        contentHeight > windowHeight
          ? windowHeight + contentOffsetY >= contentHeight - THRESHOLD
          : false

      setIsAtEnd(isScrollAtEnd)
    },
    [isAtEnd, contentHeight, windowHeight]
  )

  // Memoized context value
  const value = useMemo(
    () => ({
      direction,
      isAtEnd,
      onScroll,
      onContentSizeChange,
      ref,
    }),
    [direction, isAtEnd, onScroll, onContentSizeChange]
  )

  return <ScrollDirection.Provider value={value}>{children}</ScrollDirection.Provider>
}

export const useScrollDirection = () => {
  const context = useContext(ScrollDirection)
  if (!context) {
    throw new Error('useScrollDirection must be used within a ScrollDirectionProvider')
  }
  return context
}
