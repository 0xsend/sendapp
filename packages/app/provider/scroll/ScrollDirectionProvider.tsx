import { usePathname } from 'app/utils/usePathname'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

export type ScrollDirectionContextValue = {
  direction: 'up' | 'down' | null
  isAtEnd: boolean
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
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

  useEffect(() => {
    setPreviousPath((previousPath) => {
      if (previousPath !== pathName) {
        setDirection(null)
        setIsAtEnd(false)
      }
      return pathName
    })
  }, [pathName])

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const currentScrollY = contentOffset.y
    const isEndOfView = layoutMeasurement.height + currentScrollY >= contentSize.height - THRESHOLD
    setIsAtEnd(isEndOfView)

    // Update direction
    if (currentScrollY < THRESHOLD) {
      setDirection('up')
    } else if (lastScrollY.current - currentScrollY > THRESHOLD && !isEndOfView) {
      setDirection('up')
    } else if (currentScrollY - lastScrollY.current > THRESHOLD || isEndOfView) {
      setDirection('down')
    }

    lastScrollY.current = currentScrollY
  }

  return (
    <ScrollDirection.Provider value={{ direction, isAtEnd, onScroll }}>
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
