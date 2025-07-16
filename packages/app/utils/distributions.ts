import type { Database, Tables } from '@my/supabase/database.types'
import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  entryPointAddress,
  multicall3Address,
  sendAccountAbi,
  sendMerkleDropAbi,
  type sendMerkleDropAddress,
  sendTokenAbi,
  type sendTokenAddress,
  sendUniswapV3PoolAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import {
  getUserOperationHash,
  type GetUserOperationReceiptReturnType,
  type UserOperation,
} from 'permissionless'
import type { MergeDeep } from 'type-fest'
import {
  type Address,
  type CallExecutionError,
  encodeFunctionData,
  isAddress,
  zeroAddress,
} from 'viem'
import { useReadContract, useReadContracts, useSimulateContract } from 'wagmi'
import { api } from './api'
import { assert } from './assert'
import { byteaToBase64URLNoPad } from './byteaToBase64URLNoPad'
import { byteaToHex } from './byteaToHex'
import { adjustUTCDateForTimezone } from './dateHelper'
import { useSendAccount } from './send-accounts'
import { signUserOpHash } from './signUserOp'
import { selectAll } from './supabase/selectAll'
import { throwNiceError } from './userop'
import { defaultUserOp } from 'app/utils/userOpConstants'

export const DISTRIBUTION_INITIAL_POOL_AMOUNT = BigInt(20e9)

export type UseDistributionsResultData = MergeDeep<
  NonNullable<Awaited<ReturnType<typeof fetchDistributions>>['data']>[number],
  {
    qualification_end: Date
    timezone_adjusted_qualification_end: Date
    qualification_start: Date
    claim_end: Date
  }
>[]

function fetchDistributions(supabase: SupabaseClient<Database>) {
  return supabase.from('distributions').select(`
      amount::text,
      bonus_pool_bips,
      chain_id,
      claim_end,
      created_at,
      description,
      fixed_pool_bips,
      hodler_min_balance::text,
      hodler_pool_bips,
      id,
      merkle_drop_addr,
      name,
      number,
      tranche_id,
      qualification_end,
      qualification_start,
      snapshot_block_num::text,
      token_addr,
      token_decimals,
      updated_at,
      earn_min_balance::text,
      distribution_shares(
        address,
        amount::text,
        bonus_pool_amount::text,
        created_at,
        distribution_id,
        fixed_pool_amount::text,
        hodler_pool_amount::text,
        id,
        index,
        updated_at,
        user_id
      ),
      distribution_verification_values (
        bips_value,
        created_at,
        distribution_id,
        fixed_value::text,
        multiplier_max,
        multiplier_min,
        multiplier_step,
        type,
        updated_at
      ),
      send_slash(*)
    `)
}

export const useDistributions = (): UseQueryResult<UseDistributionsResultData, PostgrestError> => {
  const supabase = useSupabase()
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['distributions'],
    queryFn: async () => {
      const { data, error } = await fetchDistributions(supabase).order('number', {
        ascending: false,
      })
      if (error) {
        throw error
      }

      return data.map((distribution) => ({
        ...distribution,
        qualification_end: new Date(distribution.qualification_end),
        timezone_adjusted_qualification_end: adjustUTCDateForTimezone(
          new Date(distribution.qualification_end)
        ),
        qualification_start: new Date(distribution.qualification_start),
        claim_end: new Date(distribution.claim_end),
      }))
    },
  })
}

//@todo: make a Zod type for the JSON in distribution_verifications_summary
/*
After distribution 6 we switched to monthly distributions
This function cuts out the first 6 distributions
*/
export const useMonthlyDistributions = () => {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['monthly_distributions', sendAccount?.created_at],
    queryFn: async () => {
      const { data, error } = await fetchDistributions(supabase)
        .gt('number', 6)
        .gt('qualification_end', sendAccount?.created_at)
        .lte('qualification_start', new Date().toUTCString())
        .order('number', { ascending: false })

      if (error) throw error

      return data.map((distribution) => ({
        ...distribution,
        qualification_end: new Date(distribution.qualification_end),
        timezone_adjusted_qualification_end: adjustUTCDateForTimezone(
          new Date(distribution.qualification_end)
        ),
        qualification_start: new Date(distribution.qualification_start),
        claim_end: new Date(distribution.claim_end),
      }))
    },
    enabled: Boolean(sendAccount?.created_at),
  })
}

function fetchDistributionVerifications(
  supabase: SupabaseClient<Database>,
  distributionNumber: number
) {
  return selectAll(
    supabase
      .from('distributions')
      .select(
        `
        id,
        number,
        distribution_verification_values(
          type,
          fixed_value::text,
          multiplier_max,
          multiplier_min,
          multiplier_step,
          distribution_verifications(
            user_id,
            type,
            weight::text,
            metadata,
            created_at
          )
        )
        `,
        { count: 'exact' }
      )
      .eq('number', distributionNumber)
  )
}

export type DistributionsVerificationsQuery = ReturnType<typeof useDistributionVerifications>

const TYPES_REQUIRING_CREATED_AT: Array<Database['public']['Enums']['verification_type']> = [
  'create_passkey',
]

export const useDistributionVerifications = (distributionNumber?: number) => {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['distribution_verifications', { distributionNumber }] as const,
    queryFn: async ({ queryKey: [, { distributionNumber }] }) => {
      assert(!!distributionNumber, 'distributionNumber is required')

      const { data, error } = await fetchDistributionVerifications(supabase, distributionNumber)

      if (error) throw error
      if (!data?.[0]) return null

      // Get the first (and should be only) distribution
      const distribution = data[0]

      const verification_values = distribution.distribution_verification_values
        .map((item) => {
          const verifications = item.distribution_verifications ?? []
          const totalWeight = verifications.reduce((sum, v) => sum + BigInt(v.weight ?? 0), 0n)
          const latestCreatedAt = verifications.reduce(
            (maxDate, v) => (!maxDate || v.created_at > maxDate ? v.created_at : maxDate),
            ''
          )
          return {
            type: item.type as Database['public']['Enums']['verification_type'],
            weight: totalWeight,
            count: verifications.length,
            fixed_value: BigInt(item.fixed_value ?? 0),
            metadata: verifications.map((v) => v.metadata).filter(Boolean),
            created_at: latestCreatedAt,
          }
        })
        .filter(
          ({ created_at, type }) => !TYPES_REQUIRING_CREATED_AT.includes(type) || created_at !== ''
        )

      const multipliers = (distribution.distribution_verification_values ?? []).map((item) => {
        const verifications = item.distribution_verifications ?? []
        const totalWeight = verifications.reduce((sum, v) => sum + BigInt(v.weight ?? 0), 0n)

        return {
          type: item.type as Database['public']['Enums']['verification_type'],
          value:
            (item.multiplier_min === 1.0 &&
              item.multiplier_max === 1.0 &&
              item.multiplier_step === 0.0) ||
            totalWeight === 0n
              ? null
              : Math.min(
                  (Math.round(item.multiplier_min * 10) +
                    Math.round(Number(totalWeight - 1n) * item.multiplier_step * 10)) /
                    10,
                  item.multiplier_max
                ),
          multiplier_min: item.multiplier_min ?? 1.0,
          multiplier_max: item.multiplier_max ?? 1.0,
          multiplier_step: item.multiplier_step ?? 0.0,
          metadata: verifications.map((v) => v.metadata).filter(Boolean),
        }
      })

      return {
        distributionNumber,
        verification_values,
        multipliers,
      }
    },
    enabled: Boolean(distributionNumber),
  })
}

export const useActiveDistribution = () => {
  const { data: distributions, isLoading, error } = useDistributions()
  if (error) {
    return {
      isLoading,
      error,
    }
  }
  const now = new Date()
  return {
    distribution: distributions
      ?.sort(({ number: a }, { number: b }) => b - a)
      .find((distribution) => {
        return (
          distribution.qualification_start < now &&
          (distribution.qualification_end > now || distribution.claim_end > now)
        )
      }),
    isLoading,
    error,
  }
}

export const useSendSellCountDuringDistribution = (
  distribution: UseDistributionsResultData[number]
): UseQueryResult<Tables<'send_token_transfers'>[], Error> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['distributions', 'send_token_transfers', distribution.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('send_token_transfers')
        .select('*', { count: 'exact' })
        .eq('t', `\\x${sendUniswapV3PoolAddress.slice(2)}`)
        .gte('block_time', distribution.qualification_start.getTime() / 1000)
        .lte('block_time', distribution.qualification_end.getTime() / 1000)

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}

/**
 * @param tranche The tranche to query. 0-indexed.
 * @returns Whether the tranche is active.
 */
export function useSendMerkleDropTrancheActive({
  chainId,
  tranche,
  query,
  address,
}: {
  chainId: keyof typeof sendMerkleDropAddress
  tranche: bigint
  query?: { enabled?: boolean }
  address: `0x${string}` | undefined
}) {
  return useReadContract({
    abi: sendMerkleDropAbi,
    address,
    chainId,
    args: [tranche],
    functionName: 'trancheActive',
    query,
  })
}

/**
 * @param tranche The tranche to query. 0-indexed.
 * @param index The index of the claim in the tranche to query. 0-indexed.
 * @param chainId The chain to query.
 * @returns Whether the claim has been claimed by the user.
 */
export function useSendMerkleDropIsClaimed({
  chainId,
  tranche,
  index,
  query,
  address,
}: {
  chainId: keyof typeof sendMerkleDropAddress
  tranche: bigint
  index?: bigint
  query?: { enabled?: boolean }
  address: `0x${string}` | undefined
}) {
  return useReadContract({
    abi: sendMerkleDropAbi,
    address: address,
    functionName: 'isClaimed',
    chainId,
    args: [tranche, index ?? -1n],
    query,
  })
}

const useSendMerkleDropsAreClaimedQueryKey = 'sendMerkleDropsAreClaimed'

export type MerkleDropClaimParams = {
  chainId: keyof typeof sendMerkleDropAddress
  tranche: bigint
  index?: bigint | undefined
  address: Address
}

/**
 * Checks whether multiple merkle drops have been claimed by querying the `isClaimed` function
 * for each provided merkle drop configuration.
 *
 * @param merkleDrops Array of merkle drop configurations to check claim status for
 * @returns Query result with claim status data for each merkle drop
 *
 * @businessLogic
 * This hook batches multiple `isClaimed` contract calls using multicall for efficiency.
 * It's optimized for minimal refetching since claim status rarely changes.
 *
 */
export function useSendMerkleDropsAreClaimed(merkleDrops: MerkleDropClaimParams[]) {
  const contracts = merkleDrops.map(
    ({ chainId, tranche, index, address }) =>
      ({
        address,
        chainId,
        abi: sendMerkleDropAbi,
        functionName: 'isClaimed',
        args: [tranche, index],
      }) as const
  )

  return useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      refetchInterval: Number.POSITIVE_INFINITY,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    multicallAddress: multicall3Address[baseMainnetClient.chain.id],
  })
}
useSendMerkleDropsAreClaimed.queryKey = useSendMerkleDropsAreClaimedQueryKey

type SendMerkleDropClaimTrancheArgs = {
  distribution: UseDistributionsResultData[number]
  share?: UseDistributionsResultData[number]['distribution_shares'][number]
}

export type UseUserOpClaimMutationArgs = {
  /**
   * The user operation to send.
   */
  userOp: UserOperation<'v0.7'>
  /**
   * The valid until epoch timestamp for the user op.
   */
  validUntil?: number
  /**
   * The signature version of the user op.
   */
  version?: number
  /**
   * The list of send account credentials to use for signing the user op.
   */
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[]
}

/**
 * Given a Send Account, distribution, and share, returns a mutation to claim send rewards
 *
 * @param userOp The user operation to send.
 * @param validUntil The valid until timestamp for the user op.
 */
export function useUserOpClaimMutation() {
  return useMutation({
    mutationFn: sendUserOpClaim,
  })
}

export async function sendUserOpClaim({
  userOp,
  version,
  validUntil,
  webauthnCreds,
}: UseUserOpClaimMutationArgs): Promise<GetUserOperationReceiptReturnType> {
  const chainId = baseMainnetClient.chain.id
  const entryPoint = entryPointAddress[chainId]
  const userOpHash = getUserOperationHash({
    userOperation: userOp,
    entryPoint,
    chainId,
  })

  // simulate
  await baseMainnetClient
    .call({
      account: entryPointAddress[baseMainnetClient.chain.id],
      to: userOp.sender,
      data: userOp.callData,
    })
    .catch((e) => {
      const error = e as CallExecutionError
      console.error('Failed to simulate userop', e)
      if (error.shortMessage) throw error.shortMessage
      throw e
    })

  userOp.signature = await signUserOpHash({
    userOpHash,
    version,
    validUntil,
    allowedCredentials:
      webauthnCreds?.map((c) => ({
        id: byteaToBase64URLNoPad(c.raw_credential_id),
        userHandle: c.name,
      })) ?? [],
  })
  try {
    const hash = await baseMainnetBundlerClient.sendUserOperation({
      userOperation: userOp,
    })
    const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
    assert(receipt.success === true, 'Failed to send userOp')
    return receipt
  } catch (e) {
    throwNiceError(e)
  }
}

export function useGenerateClaimUserOp({
  distribution,
  share,
  nonce,
}: {
  distribution: UseDistributionsResultData[number]
  share?: UseDistributionsResultData[number]['distribution_shares'][number]
  nonce?: bigint
}): UseQueryResult<UserOperation<'v0.7'>> {
  const trancheId = BigInt(distribution.tranche_id) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const merkleDropAddress = byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)

  // get the merkle proof from the database
  const {
    data: merkleProof,
    isLoading: isLoadingProof,
    error: errorProof,
  } = api.distribution.proof.useQuery({ distributionId: distribution.id })
  const { address: sender, amount, index } = share ?? {}

  const {
    data: isClaimed,
    isLoading: isClaimedLoading,
    error: isClaimedError,
  } = useSendMerkleDropIsClaimed({
    chainId,
    tranche: trancheId,
    index: share?.index !== undefined ? BigInt(share.index) : undefined,
    address: merkleDropAddress,
  })

  const {
    data: trancheActive,
    isLoading: isLoadingTrancheActive,
    error: errorTrancheActive,
  } = useSendMerkleDropTrancheActive({
    address: merkleDropAddress,
    chainId,
    tranche: trancheId,
    query: { enabled: Boolean(trancheId && chainId) },
  })

  const enabled =
    !isLoadingProof &&
    !errorProof &&
    merkleProof !== undefined &&
    index !== undefined &&
    amount !== undefined &&
    sender !== undefined &&
    !isClaimedLoading &&
    !isClaimedError &&
    isClaimed !== undefined &&
    !isClaimed &&
    !isLoadingTrancheActive &&
    !errorTrancheActive &&
    trancheActive !== undefined &&
    trancheActive // tranche is onchain and active

  return useQuery({
    queryKey: [
      'generateClaimUserOp',
      sender,
      merkleDropAddress,
      String(amount),
      String(index),
      String(nonce),
      String(chainId),
      enabled,
      String(trancheId),
      merkleProof,
    ],
    enabled: enabled,
    queryFn: () => {
      assert(!!sender && isAddress(sender), 'Invalid send account address')
      assert(typeof amount === 'string' && BigInt(amount) > 0n, 'Invalid amount')
      assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [
          [
            {
              dest: merkleDropAddress,
              value: 0n,
              data: encodeFunctionData({
                abi: sendMerkleDropAbi,
                functionName: 'claimTranche',
                args: [
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
                  sender!,
                  trancheId,
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
                  BigInt(index!),
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
                  BigInt(amount!),
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
                  merkleProof!,
                ],
              }),
            },
          ],
        ],
      })

      const paymaster = tokenPaymasterAddress[chainId]
      const userOp: UserOperation<'v0.7'> = {
        ...defaultUserOp,
        sender,
        nonce,
        callData,
        paymaster,
        paymasterData: '0x',
        signature: '0x',
      }

      return userOp
    },
  })
}

export const usePrepareSendMerkleDropClaimTrancheWrite = ({
  distribution,
  share,
}: SendMerkleDropClaimTrancheArgs) => {
  const trancheId = BigInt(distribution.tranche_id) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const merkleDropAddress = byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)
  // get the merkle proof from the database
  const {
    data: merkleProof,
    isLoading: isLoadingProof,
    error: errorProof,
  } = api.distribution.proof.useQuery({ distributionId: distribution.id })
  const { address, amount, index } = share ?? {}

  const {
    data: isClaimed,
    isLoading: isClaimedLoading,
    error: isClaimedError,
  } = useSendMerkleDropIsClaimed({
    chainId,
    tranche: trancheId,
    index: share?.index !== undefined ? BigInt(share.index) : undefined,
    address: merkleDropAddress,
  })

  const {
    data: trancheActive,
    isLoading: isLoadingTrancheActive,
    error: errorTrancheActive,
  } = useReadContract({
    abi: sendMerkleDropAbi,
    address: merkleDropAddress,
    functionName: 'trancheActive',
    chainId,
    args: [trancheId],
  })

  const enabled =
    !isLoadingProof &&
    !errorProof &&
    merkleProof !== undefined &&
    index !== undefined &&
    amount !== undefined &&
    address !== undefined &&
    !isClaimedLoading &&
    !isClaimedError &&
    isClaimed !== undefined &&
    !isClaimed &&
    !isLoadingTrancheActive &&
    !errorTrancheActive &&
    trancheActive !== undefined &&
    trancheActive // tranche is onchain and active

  return useSimulateContract({
    abi: sendMerkleDropAbi,
    functionName: 'claimTranche',
    chainId: chainId,
    address: merkleDropAddress,
    account: address,
    query: {
      enabled,
    },
    // claimTranche(
    //     address _address,
    //     uint256 _tranche,
    //     uint256 _index,
    //     uint256 _amount,
    //     bytes32[] memory _merkleProof
    // )
    args: enabled
      ? // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
        [address!, trancheId, BigInt(index!), BigInt(amount!), merkleProof!]
      : undefined,
  })
}

export function useSnapshotBalance({
  distribution,
  sendAccount,
}: {
  distribution: UseDistributionsResultData[number]
  sendAccount: Tables<'send_accounts'> | null | undefined
}) {
  return useReadContract({
    abi: sendTokenAbi,
    chainId: distribution.chain_id as keyof typeof sendTokenAddress,
    address: distribution.token_addr
      ? byteaToHex(distribution.token_addr as `\\x${string}`)
      : undefined,
    args: [sendAccount?.address ?? zeroAddress],
    blockNumber: distribution.snapshot_block_num
      ? BigInt(distribution.snapshot_block_num)
      : undefined,
    functionName: 'balanceOf',
    query: {
      enabled: Boolean(sendAccount?.address),
    },
  })
}
