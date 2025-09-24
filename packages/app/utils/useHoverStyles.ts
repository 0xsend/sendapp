import { useMemo } from 'react'
import { useThemeName } from 'tamagui'
import { Platform } from 'react-native'

type ReturnType = {
  backgroundColor: `rgba(${string})`
  transition?: string
  cursor?: string
}

export const useHoverStyles = (): ReturnType => {
  const theme = useThemeName()

  const rowHoverBC = useMemo(() => {
    return theme?.startsWith('dark') ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
  }, [theme])

  const memoizedWebReturn: ReturnType = useMemo(() => {
    return {
      backgroundColor: rowHoverBC,
      transition: 'background 0.2s ease-in-out',
      cursor: 'pointer',
    }
  }, [rowHoverBC])

  const memoizedNativeReturn: ReturnType = useMemo(() => {
    return {
      backgroundColor: rowHoverBC,
    }
  }, [rowHoverBC])

  if (Platform.OS !== 'web') {
    return memoizedNativeReturn
  }

  return memoizedWebReturn
}
