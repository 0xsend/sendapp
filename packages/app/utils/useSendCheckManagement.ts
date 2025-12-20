import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccount } from './send-accounts'
import { useSendUserOpMutation } from './sendUserOp'
import { useAccountNonce } from './userop'
import { assert } from './assert'
import { defaultUserOp } from './userOpConstants'
import {
  baseMainnetClient,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { encodeFunctionData, type Hex } from 'viem'
import type { UserOperation } from 'permissionless'
import { z } from 'zod'

const ACTIVE_CHECKS_QUERY_KEY = 'user_active_checks'
const CHECKS_HISTORY_QUERY_KEY = 'user_checks_history'

/**
 * Schema for active check data from Supabase
 */
const ActiveCheckSchema = z.object({
  id: z.number(),
  chain_id: z.coerce.number(),
  block_time: z.coerce.number(),
  tx_hash: z.string(), // bytea comes as hex string
  ephemeral_address: z.string(),
  sender: z.string(),
  amount: z.coerce.bigint(),
  token: z.string(),
  expires_at: z.coerce.number(),
  block_num: z.coerce.number(),
  is_expired: z.boolean(),
})

export type ActiveCheck = z.infer<typeof ActiveCheckSchema>

/**
 * Schema for check history data from Supabase
 */
const CheckHistorySchema = z.object({
  id: z.number(),
  chain_id: z.coerce.number(),
  block_time: z.coerce.number(),
  tx_hash: z.string(),
  ephemeral_address: z.string(),
  sender: z.string(),
  amount: z.coerce.bigint(),
  token: z.string(),
  expires_at: z.coerce.number(),
  block_num: z.coerce.number(),
  is_claimed: z.boolean(),
  claimed_by: z.string().nullable(),
  claimed_at: z.coerce.number().nullable(),
})

export type CheckHistory = z.infer<typeof CheckHistorySchema>

/**
 * Get the SendCheck contract address for the current chain.
 */
function getSendCheckAddress(chainId: number): Hex | null {
  return sendCheckAddress[chainId as keyof typeof sendCheckAddress] ?? null
}

/**
 * Hook to fetch active (unclaimed) checks for the current user.
 */
export function useUserActiveChecks() {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()
  const userAddress = sendAccount?.address

  return useQuery({
    queryKey: [ACTIVE_CHECKS_QUERY_KEY, userAddress],
    enabled: !!userAddress,
    queryFn: async () => {
      assert(!!userAddress, 'User address is required')

      // Convert address to bytea format for Supabase
      const addressBytes = `\\x${userAddress.slice(2).toLowerCase()}`

      const { data, error } = await supabase.rpc('get_user_active_checks', {
        user_address: addressBytes,
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch active checks')
      }

      return z.array(ActiveCheckSchema).parse(data ?? [])
    },
  })
}

useUserActiveChecks.queryKey = ACTIVE_CHECKS_QUERY_KEY

/**
 * Hook to fetch check history (all checks, including claimed) for the current user.
 */
export function useUserChecksHistory() {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()
  const userAddress = sendAccount?.address

  return useQuery({
    queryKey: [CHECKS_HISTORY_QUERY_KEY, userAddress],
    enabled: !!userAddress,
    queryFn: async () => {
      assert(!!userAddress, 'User address is required')

      // Convert address to bytea format for Supabase
      const addressBytes = `\\x${userAddress.slice(2).toLowerCase()}`

      const { data, error } = await supabase.rpc('get_user_checks_history', {
        user_address: addressBytes,
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch check history')
      }

      return z.array(CheckHistorySchema).parse(data ?? [])
    },
  })
}

useUserChecksHistory.queryKey = CHECKS_HISTORY_QUERY_KEY

export type RevokeCheckArgs = {
  ephemeralAddress: Hex
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[]
}

/**
 * Hook for revoking (self-claiming) a check.
 * This allows the sender to reclaim the tokens from an unclaimed check.
 */
export function useSendCheckRevoke() {
  const { data: sendAccount } = useSendAccount()
  const { data: nonce } = useAccountNonce({ sender: sendAccount?.address })
  const { mutateAsync: sendUserOpAsync, isPending, error } = useSendUserOpMutation()
  const queryClient = useQueryClient()
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  const revokeCheck = async ({
    ephemeralAddress,
    webauthnCreds,
  }: RevokeCheckArgs): Promise<Hex> => {
    assert(!!sendAccount?.address, 'Send account not loaded')
    assert(!!checkAddress, 'SendCheck contract not deployed on this chain')
    assert(nonce !== undefined, 'Account nonce not loaded')
    assert(webauthnCreds.length > 0, 'No webauthn credentials available')

    // Create call data for claimCheckSelf
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'execute',
      args: [
        checkAddress,
        0n,
        encodeFunctionData({
          abi: sendCheckAbi,
          functionName: 'claimCheckSelf',
          args: [ephemeralAddress],
        }),
      ],
    })

    const paymaster = tokenPaymasterAddress[chainId]
    const userOp: UserOperation<'v0.7'> = {
      ...defaultUserOp,
      sender: sendAccount.address,
      nonce,
      callData,
      paymaster,
      paymasterData: '0x',
      signature: '0x',
    }

    // Submit the user operation
    const receipt = await sendUserOpAsync({ userOp, webauthnCreds })

    // Invalidate queries to refresh the check lists
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] }),
      queryClient.invalidateQueries({ queryKey: [ACTIVE_CHECKS_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [CHECKS_HISTORY_QUERY_KEY] }),
    ])

    return receipt.receipt.transactionHash
  }

  return {
    revokeCheck,
    isPending,
    error,
    isReady: !!sendAccount?.address && !!checkAddress && nonce !== undefined,
  }
}
