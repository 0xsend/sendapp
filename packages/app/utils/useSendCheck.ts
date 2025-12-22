import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccount } from './send-accounts'
import { useSendUserOpMutation } from './sendUserOp'
import { useAccountNonce, useUserOp, type SendAccountCall } from './userop'
import { assert } from './assert'
import { useUSDCFees } from './useUSDCFees'
import { baseMainnetClient, sendCheckAbi, sendCheckAddress } from '@my/wagmi'
import { encodeFunctionData, type Hex } from 'viem'
import type { Database, PgBytea } from '@my/supabase/database.types'
import { useMemo, useCallback } from 'react'

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
  webauthnCreds: { raw_credential_id: PgBytea; name: string }[]
}

export type UseSendCheckRevokeArgs = {
  ephemeralAddress?: Hex
}

/**
 * Builds the calls for revoking a SendCheck (claimCheckSelf).
 */
function buildRevokeCheckCalls({
  ephemeralAddress,
  checkAddress,
}: {
  ephemeralAddress: Hex
  checkAddress: Hex
}): SendAccountCall[] {
  return [
    {
      dest: checkAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: sendCheckAbi,
        functionName: 'claimCheckSelf',
        args: [ephemeralAddress],
      }),
    },
  ]
}

/**
 * Hook for revoking (self-claiming) a check.
 * This allows the sender to reclaim the tokens from an unclaimed check.
 * Prepares the UserOp upfront to calculate fees, then submits when revokeCheck is called.
 */
export function useSendCheckRevoke({ ephemeralAddress }: UseSendCheckRevokeArgs = {}) {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const { mutateAsync: sendUserOpAsync, isPending, error } = useSendUserOpMutation()
  const queryClient = useQueryClient()
  const chainId = baseMainnetClient.chain.id
  const checkAddress = getSendCheckAddress(chainId)

  // Build calls for fee estimation
  const calls = useMemo(() => {
    if (!ephemeralAddress || !checkAddress) {
      return undefined
    }

    return buildRevokeCheckCalls({
      ephemeralAddress,
      checkAddress,
    })
  }, [ephemeralAddress, checkAddress])

  // Prepare UserOp for fee estimation
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
    refetch: refetchUserOp,
  } = useUserOp({ sender, calls })

  // Calculate USDC fees
  const {
    data: usdcFees,
    error: usdcFeesError,
    isLoading: isLoadingFees,
    refetch: refetchFees,
  } = useUSDCFees({ userOp })

  const isPreparing = isLoadingUserOp || isLoadingFees
  const prepareError = userOpError || usdcFeesError

  const refetchPrepare = useCallback(async () => {
    await refetchUserOp()
    await refetchFees()
  }, [refetchUserOp, refetchFees])

  const revokeCheck = useCallback(
    async ({ webauthnCreds }: RevokeCheckArgs): Promise<Hex> => {
      assert(!!sender, 'Send account not loaded')
      assert(!!checkAddress, 'SendCheck contract not deployed on this chain')
      assert(!!userOp, 'UserOp not prepared')
      assert(webauthnCreds.length > 0, 'No webauthn credentials available')

      // Submit the user operation
      const receipt = await sendUserOpAsync({ userOp, webauthnCreds })

      // Invalidate queries to refresh the check lists
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] }),
        queryClient.invalidateQueries({ queryKey: [USER_SEND_CHECKS_QUERY_KEY] }),
      ])

      return receipt.receipt.transactionHash
    },
    [sender, checkAddress, userOp, sendUserOpAsync, queryClient]
  )

  return {
    revokeCheck,
    isPending,
    error,
    isPreparing,
    prepareError,
    userOp,
    usdcFees,
    refetchPrepare,
    isReady: !!sender && !!checkAddress && !!userOp,
    checkAddress,
  }
}
