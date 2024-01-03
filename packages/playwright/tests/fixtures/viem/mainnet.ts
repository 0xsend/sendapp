import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

if (!process.env.NEXT_PUBLIC_MAINNET_RPC_URL) {
  throw new Error('NEXT_PUBLIC_MAINNET_RPC_URL is not set')
}
const NEXT_PUBLIC_MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC_URL

export const testMainnetClient = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(NEXT_PUBLIC_MAINNET_RPC_URL),
})
