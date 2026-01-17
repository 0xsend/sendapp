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

  // Refs for performance-critical values (avoid re-renders)
  const contentOffsetRef = useRef(0)
  const scrollPositionsRef = useRef<ScrollPositions>({})
  const isAtEndRef = useRef(false)
  const rafPendingRef = useRef(false)

  // State for UI updates (only direction triggers re-render)
  const [direction, setDirection] = useState<ScrollDirectionContextValue['direction']>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)
  const [isAtEnd, setIsAtEnd] = useState(false)

  useEffect(() => {
    const key = generateScrollKey(pathname, query)
    const positions = scrollPositionsRef.current
    if (positions[key] === undefined) {
      positions[key] = 0
    } else if (contentHeight >= positions[key]) {
      ref.current?.scrollTo({ y: positions[key], animated: false })
    }
    if (contentHeight <= windowHeight) {
      setDirection(null)
    }
  }, [pathname, query, contentHeight, windowHeight])

  // Callback for content size change
  const onContentSizeChange = useCallback(
    (w: number, height: number) => {
      setContentHeight(height)
      const atEnd = height <= windowHeight
      isAtEndRef.current = atEnd
      setIsAtEnd(atEnd)
    },
    [windowHeight]
  )

  // Scroll event handler - throttled via rAF
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Skip if already queued
      if (rafPendingRef.current) return
      rafPendingRef.current = true

      const { contentOffset } = e.nativeEvent
      const contentOffsetY = contentOffset.y

      requestAnimationFrame(() => {
        rafPendingRef.current = false

        const key = generateScrollKey(pathname, query)
        const prevOffset = contentOffsetRef.current
        const atEnd = isAtEndRef.current

        // Determine new direction - only update state if changed
        let newDirection: ScrollDirectionContextValue['direction'] = null
        if (contentOffsetY < THRESHOLD) {
          newDirection = 'up'
        } else if (prevOffset - contentOffsetY > THRESHOLD && !atEnd) {
          newDirection = 'up'
        } else if (contentOffsetY - prevOffset > THRESHOLD || atEnd) {
          newDirection = 'down'
        }

        // Only trigger re-render if direction actually changed
        if (newDirection !== null) {
          setDirection((prev) => (prev !== newDirection ? newDirection : prev))
        }

        // Update refs without triggering re-renders
        contentOffsetRef.current = contentOffsetY
        scrollPositionsRef.current[key] = contentOffsetY

        // Check if at the end of content
        const isScrollAtEnd =
          contentHeight > windowHeight
            ? windowHeight + contentOffsetY >= contentHeight - THRESHOLD
            : false

        // Only update state if changed
        if (isScrollAtEnd !== isAtEndRef.current) {
          isAtEndRef.current = isScrollAtEnd
          setIsAtEnd(isScrollAtEnd)
        }
      })
    },
    [contentHeight, windowHeight, pathname, query]
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
