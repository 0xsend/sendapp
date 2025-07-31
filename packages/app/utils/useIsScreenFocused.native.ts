import { useIsFocused } from '@react-navigation/native'

export default function useIsScreenFocused(): boolean {
  return useIsFocused()
}
