import { usePathname } from 'app/utils/usePathname'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

export type ScrollDirectionContextValue = {
  direction: 'up' | 'down' | null
  isAtEnd: boolean
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onContentSizeChange: (width: number, height: number) => void
  onLayout: (e: LayoutChangeEvent) => void
}

const ScrollDirection = createContext<ScrollDirectionContextValue>(
  undefined as unknown as ScrollDirectionContextValue
)

const THRESHOLD = 50

export const ScrollDirectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [direction, setDirection] = useState<ScrollDirectionContextValue['direction']>(null)
  const [isAtEnd, setIsAtEnd] = useState<ScrollDirectionContextValue['isAtEnd']>(false)
  const lastScrollY = useRef(0)
  const pathName = usePathname()
  const [, setPreviousPath] = useState('')
  const [viewportHeight, setViewportHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    setPreviousPath((previousPath) => {
      if (previousPath !== pathName) {
        setDirection(null)
        setIsAtEnd(false)
        setContentHeight(0)
        setViewportHeight(0)
      }
      return pathName
    })
  }, [pathName])

  const checkIsAtEnd = useCallback((contentHeight: number, viewportHeight: number, scrollY = 0) => {
    const isContentShorterThanViewport = contentHeight <= viewportHeight
    const isEndOfView =
      isContentShorterThanViewport || viewportHeight + scrollY >= contentHeight - THRESHOLD

    setIsAtEnd(isEndOfView)
  }, [])

  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      setContentHeight(height)
      checkIsAtEnd(height, viewportHeight)
    },
    [viewportHeight, checkIsAtEnd]
  )

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height
      setViewportHeight(height)
      checkIsAtEnd(contentHeight, height)
    },
    [contentHeight, checkIsAtEnd]
  )

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = e.nativeEvent
      const currentScrollY = contentOffset.y
      checkIsAtEnd(contentHeight, viewportHeight, currentScrollY)

      // Update direction
      if (currentScrollY < THRESHOLD) {
        setDirection('up')
      } else if (lastScrollY.current - currentScrollY > THRESHOLD && !isAtEnd) {
        setDirection('up')
      } else if (currentScrollY - lastScrollY.current > THRESHOLD || isAtEnd) {
        setDirection('down')
      }

      lastScrollY.current = currentScrollY
    },
    [contentHeight, viewportHeight, isAtEnd, checkIsAtEnd]
  )

  return (
    <ScrollDirection.Provider
      value={{ direction, isAtEnd, onScroll, onLayout, onContentSizeChange }}
    >
      {children}
    </ScrollDirection.Provider>
  )
}

export const useScrollDirection = () => {
  const context = useContext(ScrollDirection)
  if (!context) {
    throw new Error('useScrollDirection must be used within a ScrollDirectionProvider')
  }
  return context
}
