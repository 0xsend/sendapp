import { useMemo } from 'react'
import { useThemeName } from 'tamagui'

/**
 * Hook to determine if current theme is dark mode
 * Pattern from: packages/app/utils/useHoverStyles.ts
 *
 * @returns boolean indicating if theme is dark
 */
export const useIsDark = (): boolean => {
  const theme = useThemeName()

  return useMemo(() => {
    return theme?.startsWith('dark') ?? false
  }, [theme])
}
