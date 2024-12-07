import { usePathname } from 'app/utils/usePathname'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

export type ScrollDirectionContextValue = {
  direction?: 'up' | 'down'
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const ScrollDirection = createContext<ScrollDirectionContextValue>(
  undefined as unknown as ScrollDirectionContextValue
)

export const ScrollDirectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [direction, setDirection] = useState<'up' | 'down'>()
  const lastScrollY = useRef(0)
  const pathName = usePathname()
  const [, setPreviousPath] = useState('')

  useEffect(() => {
    setPreviousPath((previousPath) => {
      previousPath !== pathName && setDirection(undefined)
      return pathName
    })
  }, [pathName])

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const currentScrollY = contentOffset.y
    const isEndOfView = layoutMeasurement.height + currentScrollY >= contentSize.height - 50

    // Only update direction when crossing thresholds
    if (currentScrollY < 50) {
      setDirection('up')
    } else if (lastScrollY.current - currentScrollY > 50 && !isEndOfView) {
      setDirection('up')
    } else if (currentScrollY - lastScrollY.current > 50 || isEndOfView) {
      setDirection('down')
    }

    lastScrollY.current = currentScrollY
  }

  return (
    <ScrollDirection.Provider value={{ direction, onScroll }}>{children}</ScrollDirection.Provider>
  )
}

export const useScrollDirection = () => {
  const context = useContext(ScrollDirection)
  if (!context) {
    throw new Error('useScrollDirection must be used within a ScrollDirectionProvider')
  }
  return context
}
