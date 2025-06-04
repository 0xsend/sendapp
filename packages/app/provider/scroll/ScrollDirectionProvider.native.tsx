import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'
import { Dimensions } from 'react-native'
import {
  ScrollDirection,
  type ScrollDirectionContextValue,
} from 'app/provider/scroll/ScrollDirectionContext'

const THRESHOLD = 20

const ScrollDirectionProvider = ({ children }: { children: ReactNode }) => {
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

export default ScrollDirectionProvider
