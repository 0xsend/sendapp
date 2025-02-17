import {
  SafeAreaProvider as SafeAreaProviderOg,
  type SafeAreaProviderProps,
  initialWindowMetrics,
} from 'react-native-safe-area-context'

export const SafeAreaProvider = ({ children }: React.PropsWithChildren<SafeAreaProviderProps>) => {
  return <SafeAreaProviderOg initialMetrics={initialWindowMetrics}>{children}</SafeAreaProviderOg>
}
