import { useColorScheme } from 'react-native'

export const useIsDarkTheme = () => {
  const colorScheme = useColorScheme()
  return colorScheme === 'dark'
}
