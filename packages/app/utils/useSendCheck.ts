import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
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
import type { Database, PgBytea } from '@my/supabase/database.types'

const USER_SEND_CHECKS_QUERY_KEY = 'user_send_checks'

// Same page size as activity feed
const PAGE_SIZE = 50

type GetUserChecksRow = Database['public']['Functions']['get_user_checks']['Returns'][number]

/**
 * Check with computed status fields from the RPC function
 */
export type Check = GetUserChecksRow

/**
 * Get the SendCheck contract address for the current chain.
 */
function getSendCheckAddress(chainId: number): Hex | null {
  return sendCheckAddress[chainId as keyof typeof sendCheckAddress] ?? null
}

/**
 * Hook to fetch paginated checks for the current user with infinite scroll.
 * Active checks are returned first, then history, ordered by block_time DESC.
 */
export function useUserSendChecks({ pageSize = PAGE_SIZE }: { pageSize?: number } = {}) {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()
  const userAddress = sendAccount?.address
  const sendAccountId = sendAccount?.id

  return useInfiniteQuery({
    queryKey: [USER_SEND_CHECKS_QUERY_KEY, sendAccountId, userAddress, pageSize],
    enabled: !!userAddress && !!sendAccountId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      assert(!!userAddress, 'User address is required')

      // Convert address to bytea format for Supabase
      const addressBytes = `\\x${userAddress.slice(2).toLowerCase()}` as PgBytea

      const { data, error } = await supabase.rpc('get_user_checks', {
        user_address: addressBytes,
        page_limit: pageSize,
        page_offset: pageParam * pageSize,
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch checks')
      }

      return (data ?? []) as Check[]
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < pageSize) {
        return undefined
      }
      return lastPageParam + 1
    },
  })
}

useUserSendChecks.queryKey = USER_SEND_CHECKS_QUERY_KEY

export type RevokeCheckArgs = {
  ephemeralAddress: Hex
  webauthnCreds: { raw_credential_id: PgBytea; name: string }[]
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
      queryClient.invalidateQueries({ queryKey: [USER_SEND_CHECKS_QUERY_KEY] }),
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
