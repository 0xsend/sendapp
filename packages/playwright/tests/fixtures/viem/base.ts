import { baseMainnet } from '@my/wagmi/chains'
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  publicActions,
  type HttpTransport,
  type PublicActions,
  type PublicClient,
  type TestClient,
  type LocalAccount,
  type WalletClient,
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

export function createBaseWalletClient({
  account,
}: { account: LocalAccount }): WalletClient<HttpTransport, typeof baseMainnet, LocalAccount> &
  PublicActions<HttpTransport, typeof baseMainnet> {
  return createWalletClient({
    account,
    chain: baseMainnet,
    transport: http(NEXT_PUBLIC_BASE_RPC_URL),
  }).extend(publicActions)
}
