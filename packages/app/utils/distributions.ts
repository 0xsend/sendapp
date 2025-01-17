import type { Database, Tables } from '@my/supabase/database.types'
import {
  mainnet,
  sendTokenAddress,
  sendAirdropsSafeAddress,
  sendMerkleDropAbi,
  sendMerkleDropAddress,
  sendUniswapV3PoolAddress,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  tokenPaymasterAddress,
  baseMainnetBundlerClient,
  sendTokenAbi,
} from '@my/wagmi'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useBalance, useReadContract, useSimulateContract } from 'wagmi'
import { api } from './api'
import { useSendAccount } from './send-accounts'
import { getUserOperationHash, type UserOperation } from 'permissionless'
import { assert } from './assert'
import { type CallExecutionError, encodeFunctionData, isAddress, zeroAddress } from 'viem'
import { defaultUserOp } from './useUserOpTransferMutation'
import { signUserOpHash } from './signUserOp'
import { byteaToBase64 } from './byteaToBase64'
import { throwNiceError } from './userop'
import { adjustUTCDateForTimezone } from './dateHelper'
import type { MergeDeep } from 'type-fest'
import { selectAll } from './supabase/selectAll'
import { byteaToHex } from './byteaToHex'

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
      qualification_end,
      qualification_start,
      snapshot_block_num,
      token_addr,
      token_decimals,
      updated_at,
      distribution_shares(
        address,
        amount::text,
        amount_after_slash::text,
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
    queryKey: ['distributions', supabase],
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
    queryKey: ['monthly_distributions', supabase, sendAccount?.created_at],
    queryFn: async () => {
      const { data, error } = await fetchDistributions(supabase)
        .gt('number', 6)
        .gt('qualification_end', sendAccount?.created_at)
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
  distributionId: number
) {
  return selectAll(
    supabase
      .from('distribution_verifications')
      .select(
        `
          distribution_id,
          user_id,
          type,
          weight::text,
          metadata,
          created_at,
          distribution_verification_values(
            bips_value::text,
            fixed_value::text,
            multiplier_max,
            multiplier_min,
            multiplier_step
          )
        `,
        { count: 'exact' }
      )
      .eq('distribution_id', distributionId)
  )
}

export type DistributionsVerificationsQuery = ReturnType<typeof useDistributionVerifications>
export const useDistributionVerifications = (distributionId?: number) => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['distribution_verifications', { distributionId, supabase }] as const,
    queryFn: async ({ queryKey: [, { distributionId, supabase }] }) => {
      assert(!!distributionId, 'distributionId is required')

      const { data: verifications, error: verificationError } =
        await fetchDistributionVerifications(supabase, distributionId)

      if (verificationError) throw verificationError
      if (verifications === null || verifications.length === 0) return null

      // previously this was grouped and transformed to match the distribution_verifications_summary view
      // but now we are just returning the data as from postgrest
      // transform the data to match the view's shape to avoid breaking the views
      const transformedData = {
        distribution_id: distributionId,
        user_id: verifications[0]?.user_id,
        verification_values: verifications.map((v) => ({
          type: v.type,
          weight: BigInt(v.weight ?? 0),
          fixed_value: BigInt(v.distribution_verification_values?.fixed_value ?? 0n),
          bips_value: BigInt(v.distribution_verification_values?.bips_value ?? 0n),
          metadata: v.metadata,
          created_at: v.created_at,
        })),
        multipliers: verifications.map((v) => ({
          type: v.type,
          value: BigInt(v.distribution_verification_values?.multiplier_max ?? 0n),
          multiplier_max: v.distribution_verification_values?.multiplier_max ?? 0,
          multiplier_min: v.distribution_verification_values?.multiplier_min ?? 0,
          multiplier_step: v.distribution_verification_values?.multiplier_step ?? 0,
          metadata: v.metadata,
        })),
      }

      return transformedData
    },
    enabled: Boolean(distributionId),
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

export const useSendTokenBalance = (address?: `0x${string}`) => {
  return useBalance({
    address,
    token: sendTokenAddress[mainnet.id],
    query: {
      enabled: !!address,
    },
  })
}

export const useSendDistributionCurrentPoolTotal = () =>
  useSendTokenBalance(sendAirdropsSafeAddress)

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
}: UseUserOpClaimMutationArgs) {
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
        id: byteaToBase64(c.raw_credential_id),
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
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const merkleDropAddress = byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)

  // get the merkle proof from the database
  const {
    data: merkleProof,
    isLoading: isLoadingProof,
    error: errorProof,
  } = api.distribution.proof.useQuery({ distributionId: distribution.id })
  const { address: sender, amount_after_slash, index } = share ?? {}

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
    amount_after_slash !== undefined &&
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
      String(amount_after_slash),
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
      assert(typeof amount_after_slash === 'number' && amount_after_slash > 0, 'Invalid amount')
      assert(typeof nonce === 'bigint' && nonce >= 0n, 'Invalid nonce')

      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [
          [
            {
              dest: sendMerkleDropAddress[chainId],
              value: 0n,
              data: encodeFunctionData({
                abi: sendMerkleDropAbi,
                functionName: 'claimTranche',
                args: [
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount_after_slash, and merkleProof are defined when enabled is true
                  sender!,
                  trancheId,
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount_after_slash, and merkleProof are defined when enabled is true
                  BigInt(index!),
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount_after_slash, and merkleProof are defined when enabled is true
                  BigInt(amount_after_slash!),
                  // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount_after_slash, and merkleProof are defined when enabled is true
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
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const merkleDropAddress = byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)
  // get the merkle proof from the database
  const {
    data: merkleProof,
    isLoading: isLoadingProof,
    error: errorProof,
  } = api.distribution.proof.useQuery({ distributionId: distribution.id })
  const { address, amount_after_slash, index } = share ?? {}

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
    amount_after_slash !== undefined &&
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
    address: sendMerkleDropAddress[chainId],
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
      ? // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount_after_slash, and merkleProof are defined when enabled is true
        [address!, trancheId, BigInt(index!), BigInt(amount_after_slash!), merkleProof!]
      : undefined,
  })
}
export function useSnapshotBalance(
  distribution: {
    amount: string
    bonus_pool_bips: number
    chain_id: number
    created_at: string
    description: string | null
    fixed_pool_bips: number
    hodler_min_balance: string
    hodler_pool_bips: number
    id: number
    merkle_drop_addr: string | null
    name: string
    number: number
    snapshot_block_num: number | null
    token_addr: string | null
    token_decimals: number | null
    updated_at: string
    distribution_shares: {
      address: `0x${string}`
      amount: string
      amount_after_slash: string
      bonus_pool_amount: string
      created_at: string
      distribution_id: number
      fixed_pool_amount: string
      hodler_pool_amount: string
      id: number
      index: number
      updated_at: string
      user_id: string
    }[]
    distribution_verification_values: {
      bips_value: number
      created_at: string
      distribution_id: number
      fixed_value: string
      multiplier_max: number
      multiplier_min: number
      multiplier_step: number
      type:
        | 'tag_registration'
        | 'tag_referral'
        | 'create_passkey'
        | 'send_ten'
        | 'send_one_hundred'
        | 'total_tag_referrals'
        | 'send_streak'
        | 'send_ceiling'
      updated_at: string
    }[]
    send_slash: {
      distribution_id: number
      distribution_number: number
      minimum_sends: number
      scaling_divisor: number
    }[]
    timezone_adjusted_qualification_end: Date
    qualification_end: Date
    qualification_start: Date
    claim_end: Date
  },
  sendAccount:
    | {
        chain_id: number
        created_at: string
        deleted_at: string | null
        id: string
        updated_at: string
        user_id: string
        address: `0x${string}`
        init_code: import('/Users/allen/0xbigboss/0xsend/sendapp/supabase/database.types').PgBytea
        send_account_credentials: {
          account_id: string
          created_at: string | null
          credential_id: string
          key_slot: number
          webauthn_credentials: {
            created_at: string
            deleted_at: string | null
            display_name: string
            id: string
            key_type: import('/Users/allen/0xbigboss/0xsend/sendapp/supabase/database-generated.types').Database['public']['Enums']['key_type_enum']
            name: string
            sign_count: number
            updated_at: string
            user_id: string
            raw_credential_id: import('/Users/allen/0xbigboss/0xsend/sendapp/supabase/database.types').PgBytea
            public_key: import('/Users/allen/0xbigboss/0xsend/sendapp/supabase/database.types').PgBytea
            attestation_object: import('/Users/allen/0xbigboss/0xsend/sendapp/supabase/database.types').PgBytea
          } | null
        }[]
      }
    | null
    | undefined
) {
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
