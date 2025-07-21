import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'
import { Dimensions } from 'react-native'
import {
  ScrollDirection,
  type ScrollDirectionContextValue,
} from 'app/provider/scroll/ScrollDirectionContext'
import { usePathname } from 'app/utils/usePathname'

const THRESHOLD = 20

const ScrollDirectionProvider = ({ children }: { children: ReactNode }) => {
  const ref = useRef<ScrollView>(null)

  // Get window dimensions
  const windowHeight = Dimensions.get('window').height

  // Refs for performance-critical values
  const contentOffsetRef = useRef(0)

  // State for UI updates
  const [direction, setDirection] = useState<ScrollDirectionContextValue['direction']>(null)
  const contentHeight = useRef<Record<string, number>>({})
  const [isAtEnd, setIsAtEnd] = useState(false)
  const pathname = usePathname()

  // Callback for content size change
  const onContentSizeChange = useCallback(
    (w: number, height: number) => {
      contentHeight.current[pathname] = height
      setIsAtEnd(height <= windowHeight)
    },
    [windowHeight, pathname]
  )

  // Scroll event handler
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>, threshold?: number) => {
      const _threshold = threshold ?? THRESHOLD
      const { contentOffset } = e.nativeEvent
      const contentOffsetY = contentOffset.y

      // Determine scroll direction
      if (contentOffsetY < _threshold) {
        setDirection('up')
      } else if (contentOffsetRef.current - contentOffsetY > _threshold && !isAtEnd) {
        setDirection('up')
      } else if (contentOffsetY - contentOffsetRef.current > _threshold || isAtEnd) {
        setDirection('down')
      }

      // Update last scroll position
      contentOffsetRef.current = contentOffsetY
      const _contentHeight = contentHeight.current[pathname] || 0

      // Check if at the end of content
      const isScrollAtEnd =
        _contentHeight > windowHeight
          ? windowHeight + contentOffsetY >= _contentHeight - THRESHOLD
          : false

      setIsAtEnd(isScrollAtEnd)
    },
    [isAtEnd, windowHeight, pathname]
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
