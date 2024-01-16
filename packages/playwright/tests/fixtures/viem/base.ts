import { baseLocal } from 'app/utils/viem/chains'
import { http, createPublicClient, createTestClient } from 'viem'

if (!process.env.NEXT_PUBLIC_BASE_RPC_URL) {
  throw new Error('NEXT_PUBLIC_BASE_RPC_URL is not set')
}
const NEXT_PUBLIC_BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL

export const testBaseClient = createTestClient({
  chain: baseLocal,
  mode: 'anvil',
  transport: http(NEXT_PUBLIC_BASE_RPC_URL),
})

export const baseMainnetClient = createPublicClient({
  chain: baseLocal,
  transport: http(NEXT_PUBLIC_BASE_RPC_URL),
})
