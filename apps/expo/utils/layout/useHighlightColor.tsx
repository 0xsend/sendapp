import { useColorScheme } from 'react-native'

export const useHighlightColor = () => {
  const colorScheme = useColorScheme()
  return colorScheme === 'dark' ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
}
