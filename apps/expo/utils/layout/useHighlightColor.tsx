import { useIsDarkTheme } from 'apps-expo/utils/layout/useIsDarkTheme'

export const useHighlightColor = () => {
  const isDark = useIsDarkTheme()
  return isDark ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
}
