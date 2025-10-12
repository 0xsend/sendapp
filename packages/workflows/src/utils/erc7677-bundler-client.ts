import debug from 'debug'
import { bundlerActions, type BundlerClient } from 'permissionless'
import { paymasterActionsEip7677, type PaymasterActionsEip7677 } from 'permissionless/experimental'
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from 'permissionless/types/entrypoint'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless/utils'
import { baseMainnet } from '@my/wagmi'
import { createClient, http } from 'viem'

const log = debug('app:utils:erc7677-bundler-client')

/**
 * ERC-7677 Bundler RPC URL
 *
 * ⚠️ SERVER-SIDE ONLY - This must never be exposed to the client
 * Only use process.env.ERC7677_BUNDLER_RPC_URL (never NEXT_PUBLIC_*)
 */
const ERC7677_BUNDLER_RPC_URL = process.env.ERC7677_BUNDLER_RPC_URL

if (!ERC7677_BUNDLER_RPC_URL) {
  log('Warning: ERC7677_BUNDLER_RPC_URL not set, sponsorship features will not work')
}

/**
 * ERC-7677 compliant bundler + paymaster client
 *
 * ⚠️ SERVER-SIDE ONLY - DO NOT IMPORT IN CLIENT CODE
 *
 * This client supports both bundler operations and ERC-7677 paymaster methods
 * (pm_sponsorUserOperation, etc.) and is compatible with any provider that
 * implements the Pimlico-compatible API (CDP, Pimlico, etc.).
 *
 * This client contains API keys and must only be used in:
 * - TRPC API routes (packages/api)
 * - Temporal workflows (packages/workflows)
 *
 * Never import this in packages/app or any client-facing code.
 */
export const erc7677BundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE, typeof baseMainnet> &
  PaymasterActionsEip7677<ENTRYPOINT_ADDRESS_V07_TYPE> = createClient({
  chain: baseMainnet,
  transport: http(ERC7677_BUNDLER_RPC_URL),
})
  .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
  .extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V07))
