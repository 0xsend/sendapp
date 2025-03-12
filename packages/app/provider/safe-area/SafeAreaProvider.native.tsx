import { SafeAreaProvider as SafeAreaProviderOG } from '@my/ui'

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => {
  return <SafeAreaProviderOG>{children}</SafeAreaProviderOG>
}
