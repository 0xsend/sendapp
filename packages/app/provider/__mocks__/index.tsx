import { TamaguiProvider, config } from '@my/ui'

const mockProvider = {
  Provider: ({ children }: { children: React.ReactNode }) => (
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      {children}
    </TamaguiProvider>
  ),
}

export const Provider = mockProvider.Provider
export default mockProvider
