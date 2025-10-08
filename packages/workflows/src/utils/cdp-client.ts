import debug from 'debug'
import { bundlerActions, type BundlerClient } from 'permissionless'
import { pimlicoPaymasterActions } from 'permissionless/actions/pimlico'
import type { PimlicoPaymasterClient } from 'permissionless/clients/pimlico'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless/utils'
import { baseMainnet } from '@my/wagmi'
import { createClient, http } from 'viem'

const log = debug('app:utils:cdp-client')

/**
 * CDP Bundler RPC URL
 *
 * ⚠️ SERVER-SIDE ONLY - This must never be exposed to the client
 * Only use process.env.CDP_BUNDLER_RPC_URL (never NEXT_PUBLIC_*)
 */
const CDP_BUNDLER_RPC_URL = process.env.CDP_BUNDLER_RPC_URL

if (!CDP_BUNDLER_RPC_URL) {
  log('Warning: CDP_BUNDLER_RPC_URL not set, CDP features will not work')
}

/**
 * CDP Bundler + Paymaster client (Pimlico-compatible)
 *
 * ⚠️ SERVER-SIDE ONLY - DO NOT IMPORT IN CLIENT CODE
 *
 * This client contains API keys and must only be used in:
 * - TRPC API routes (packages/api)
 * - Temporal workflows (packages/workflows)
 *
 * Never import this in packages/app or any client-facing code.
 */
export const cdpBundlerClient: BundlerClient<typeof ENTRYPOINT_ADDRESS_V07, typeof baseMainnet> &
  PimlicoPaymasterClient<typeof ENTRYPOINT_ADDRESS_V07> = createClient({
  chain: baseMainnet,
  transport: http(CDP_BUNDLER_RPC_URL),
})
  .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
  .extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07))
