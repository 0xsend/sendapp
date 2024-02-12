import { baseMainnet } from '@my/wagmi/chains'
import { http, createPublicClient, createTestClient, publicActions } from 'viem'

if (!process.env.NEXT_PUBLIC_BASE_RPC_URL) {
  throw new Error('NEXT_PUBLIC_BASE_RPC_URL is not set')
}
const NEXT_PUBLIC_BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL

export const testBaseClient = createTestClient({
  chain: baseMainnet,
  mode: 'anvil',
  transport: http(NEXT_PUBLIC_BASE_RPC_URL),
}).extend(publicActions)

export const baseMainnetClient = createPublicClient({
  chain: baseMainnet,
  transport: http(NEXT_PUBLIC_BASE_RPC_URL),
})
