import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { baseMainnetClient } from 'app/utils/viem'

export function RainbowkitProvider({ children }: { children: React.ReactNode }) {
  return <RainbowKitProvider initialChain={baseMainnetClient.chain}>{children}</RainbowKitProvider>
}
