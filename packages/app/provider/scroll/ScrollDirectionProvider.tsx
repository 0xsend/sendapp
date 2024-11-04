import { usePathname } from 'app/utils/usePathname'
import { createContext, useContext, useEffect, useState } from 'react'
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
  const [, setScrollY] = useState(0)
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
    const isEndOfView = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50
    setScrollY((prev) => {
      if ((prev > contentOffset.y && !isEndOfView) || contentOffset.y < 50) {
        setDirection('up')
      } else if (prev < e.nativeEvent.contentOffset.y || isEndOfView) {
        setDirection('down')
      } else {
        setDirection(undefined)
      }
      return e.nativeEvent.contentOffset.y
    })
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
