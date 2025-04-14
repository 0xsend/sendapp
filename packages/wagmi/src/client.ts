import debug from 'debug'
import { bundlerActions, type BundlerClient } from 'permissionless'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless/utils'
import { createClient, createPublicClient, http, type HttpTransport, type PublicClient } from 'viem'
import { baseMainnet, mainnet } from './chains'

const log = debug('app:utils:viem:client')

log(
  'Using mainnet chain',
  `chain=${mainnet.name} (${mainnet.id})`,
  `hostname=${new URL(mainnet.rpcUrls.default.http[0]).hostname}`
)

export const mainnetClient: PublicClient<HttpTransport, typeof mainnet> = createPublicClient({
  chain: mainnet,
  transport: http(mainnet.rpcUrls.default.http[0]),
})

log(
  'Using baseMainnet chain',
  `chain=${baseMainnet.name} (${baseMainnet.id})`,
  `hostname=${new URL(baseMainnet.rpcUrls.default.http[0]).hostname}`
)

export const baseMainnetClient: PublicClient<HttpTransport, typeof baseMainnet> =
  createPublicClient({
    chain: baseMainnet,
    transport: http(baseMainnet.rpcUrls.default.http[0]),
  })

const BUNDLER_RPC_URL =
  process.env.BUNDLER_RPC_URL ??
  process.env.NEXT_PUBLIC_BUNDLER_RPC_URL ??
  'http://127.0.0.1:3030/rpc'
export const baseMainnetBundlerClient: BundlerClient<
  typeof ENTRYPOINT_ADDRESS_V07,
  typeof baseMainnet
> = createClient({
  chain: baseMainnet,
  transport: http(BUNDLER_RPC_URL),
}).extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
