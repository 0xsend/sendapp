import { useRouter } from 'next/router'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'
import { Dimensions } from 'react-native'
import {
  ScrollDirection,
  type ScrollDirectionContextValue,
} from 'app/provider/scroll/ScrollDirectionContext'

export type ScrollPositions = Record<string, number>

const THRESHOLD = 50

// Helper function to generate a unique key based only on pathname and query keys
// @TODO naive approach, only seperates scroll positions by key
const generateScrollKey = (
  pathname: string,
  query: Record<string, string | string[] | undefined>
) => {
  // If no query, just return pathname
  if (Object.keys(query).length === 0) {
    return pathname
  }

  // Sort query keys to create a consistent key
  const queryKeys = Object.keys(query).sort()

  // Create a key with pathname and query keys in alphabetical order
  const queryString = queryKeys
    .map((key) => {
      // @TODO handle query params that should be unique
      if (key === 'token') {
        return `${key}=${query[key]}`
      }
      return key
    })
    .join('&')

  return `${pathname}?${queryString}`
}

const ScrollDirectionProvider = ({ children }: { children: ReactNode }) => {
  const ref = useRef<ScrollView>(null)
  const { pathname, query } = useRouter()

  // Get window dimensions
  const windowHeight = Dimensions.get('window').height

  // Refs for performance-critical values
  const contentOffsetRef = useRef(0)

  // State for UI updates
  const [direction, setDirection] = useState<ScrollDirectionContextValue['direction']>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  const [isAtEnd, setIsAtEnd] = useState(false)
  const [, setScrollPositions] = useState<ScrollPositions>({})

  useEffect(() => {
    const key = generateScrollKey(pathname, query)
    setScrollPositions((prev) => {
      if (prev[key] === undefined) {
        return { ...prev, [key]: 0 }
      }
      if (prev[key] !== undefined && contentHeight >= prev[key]) {
        ref.current?.scrollTo({ y: prev[key], animated: false })
      }
      return prev
    })
    if (contentHeight <= windowHeight) {
      setDirection(null)
    }
  }, [pathname, query, contentHeight, windowHeight])

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
      const key = generateScrollKey(pathname, query)
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
      setScrollPositions((prev) => ({ ...prev, [key]: contentOffsetY }))

      // Check if at the end of content
      const isScrollAtEnd =
        contentHeight > windowHeight
          ? windowHeight + contentOffsetY >= contentHeight - THRESHOLD
          : false

      setIsAtEnd(isScrollAtEnd)
    },
    [isAtEnd, contentHeight, windowHeight, pathname, query]
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
