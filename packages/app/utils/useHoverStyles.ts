import { useThemeSetting } from '@tamagui/next-theme'
import { useMemo } from 'react'

export const useHoverStyles = (): {
  backgroundColor: `rgba(${string})`
  transition: string
  cursor: string
} => {
  const { resolvedTheme } = useThemeSetting()

  const rowHoverBC = useMemo(() => {
    return resolvedTheme?.startsWith('dark') ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
  }, [resolvedTheme])

  return useMemo(() => {
    return {
      backgroundColor: rowHoverBC,
      transition: 'background 0.2s ease-in-out',
      cursor: 'pointer',
    }
  }, [rowHoverBC])
}
