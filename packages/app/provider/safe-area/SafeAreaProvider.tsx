import {
  SafeAreaProvider as SafeAreaProviderOg,
  type SafeAreaProviderProps,
  initialWindowMetrics,
} from '@my/ui'

export const SafeAreaProvider = ({ children }: React.PropsWithChildren<SafeAreaProviderProps>) => {
  return <SafeAreaProviderOg initialMetrics={initialWindowMetrics}>{children}</SafeAreaProviderOg>
}
