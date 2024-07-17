import { baseMainnet } from '@my/wagmi/chains'
import {
  http,
  createPublicClient,
  createTestClient,
  publicActions,
  type PublicClient,
  type PublicActions,
  type TestClient,
  type HttpTransport,
} from 'viem'

if (!process.env.NEXT_PUBLIC_BASE_RPC_URL) {
  throw new Error('NEXT_PUBLIC_BASE_RPC_URL is not set')
}
const NEXT_PUBLIC_BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL

export const testBaseClient = createTestClient({
  chain: baseMainnet,
  mode: 'anvil',
  transport: http(NEXT_PUBLIC_BASE_RPC_URL),
}).extend(publicActions) as unknown as TestClient<'anvil', HttpTransport, typeof baseMainnet> &
  PublicActions

export const baseMainnetClient = createPublicClient({
  chain: baseMainnet,
  transport: http(NEXT_PUBLIC_BASE_RPC_URL),
}) as PublicClient<HttpTransport, typeof baseMainnet>
