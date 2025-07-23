import { useMemo } from 'react'
import { useThemeName } from 'tamagui'

export const useHoverStyles = (): {
  backgroundColor: `rgba(${string})`
  transition: string
  cursor: string
} => {
  const theme = useThemeName()

  const rowHoverBC = useMemo(() => {
    return theme?.startsWith('dark') ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
  }, [theme])

  return useMemo(() => {
    return {
      backgroundColor: rowHoverBC,
      transition: 'background 0.2s ease-in-out',
      cursor: 'pointer',
    }
  }, [rowHoverBC])
}
