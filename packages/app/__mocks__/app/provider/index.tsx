import { TamaguiProvider, config } from '@my/ui'

const mockProvider = {
  Provider: ({ children }: { children: React.ReactNode }) => {
    // console.log('mockProvider')
    return (
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        {children}
      </TamaguiProvider>
    )
  },
}

export const Provider = mockProvider.Provider
export default mockProvider
