import type { GetThemeValueForKey } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import type { OpaqueColorValue } from 'react-native'

export const useHoverStyles = (): {
  background: GetThemeValueForKey<'backgroundColor'> | OpaqueColorValue
  transition: string
  cursor: string
} => {
  const { resolvedTheme } = useThemeSetting()

  const rowHoverBC: GetThemeValueForKey<'backgroundColor'> | OpaqueColorValue =
    resolvedTheme?.startsWith('dark') ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'

  return {
    background: rowHoverBC,
    transition: 'background 0.2s ease-in-out',
    cursor: 'pointer',
  }
}
