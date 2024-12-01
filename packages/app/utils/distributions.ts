import type { Tables, Views } from '@my/supabase/database.types'
import {
  mainnet,
  sendTokenAddress,
  sendAirdropsSafeAddress,
  sendMerkleDropAbi,
  sendMerkleDropAddress,
  sendUniswapV3PoolAddress,
  useReadSendMerkleDropTrancheActive,
  useReadSendMerkleDropIsClaimed,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  tokenPaymasterAddress,
  baseMainnetBundlerClient,
} from '@my/wagmi'
import type { PostgrestError } from '@supabase/supabase-js'
import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useBalance, useSimulateContract } from 'wagmi'
import { api } from './api'
import { useSendAccount } from './send-accounts'
import { getUserOperationHash, type UserOperation } from 'permissionless'
import { assert } from './assert'
import { type CallExecutionError, encodeFunctionData, isAddress } from 'viem'
import { defaultUserOp } from './useUserOpTransferMutation'
import { signUserOp } from './signUserOp'
import { byteaToBase64 } from './byteaToBase64'
import { throwNiceError } from './userop'
import { adjustUTCDateForTimezone } from './dateHelper'

export const DISTRIBUTION_INITIAL_POOL_AMOUNT = BigInt(20e9)

type UseDistributionResultDistribution = Omit<
  Tables<'distributions'>,
  'qualification_end' | 'qualification_start' | 'claim_end'
>

export type UseDistributionsResultData = (UseDistributionResultDistribution & {
  qualification_end: Date
  timezone_adjusted_qualification_end: Date
  qualification_start: Date
  claim_end: Date
  distribution_shares: Tables<'distribution_shares'>[]
  distribution_verifications_summary: Views<'distribution_verifications_summary'>[]
  send_slash: Tables<'send_slash'>[]
})[]

export const useDistributions = (): UseQueryResult<UseDistributionsResultData, PostgrestError> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['distributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select('*, distribution_shares(*), distribution_verifications_summary(*)')
        .order('number', { ascending: false })

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

/*
After distribution 6 we switched to monthly distributions
This function cuts out the first 6 distributions
*/
export const useMonthlyDistributions = (): UseQueryResult<
  UseDistributionsResultData,
  PostgrestError
> => {
  const supabase = useSupabase()
  const { data: sendAccount } = useSendAccount()

  return useQuery({
    queryKey: ['monthly_distributions', sendAccount?.created_at],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select(`
          *,
          distribution_shares(*),
          distribution_verifications_summary(*),
          send_slash(*)
        `)
        .gt('number', 6)
        .gt('qualification_end', sendAccount?.created_at)
        .order('number', { ascending: false })

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
  enabled = true,
}: { chainId: keyof typeof sendMerkleDropAddress; tranche: bigint; enabled?: boolean }) {
  return useReadSendMerkleDropTrancheActive({
    chainId,
    args: [tranche],
    query: {
      enabled: enabled && Boolean(tranche),
    },
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
  enabled = true,
}: {
  chainId: keyof typeof sendMerkleDropAddress
  tranche: bigint
  index?: bigint
  enabled?: boolean
}) {
  return useReadSendMerkleDropIsClaimed({
    chainId,
    // @ts-expect-error index is undefined if not provided
    args: [tranche, index],
    query: {
      enabled: enabled && Boolean(tranche) && Boolean(index),
    },
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

  userOp.signature = await signUserOp({
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
  })

  const {
    data: trancheActive,
    isLoading: isLoadingTrancheActive,
    error: errorTrancheActive,
  } = useReadSendMerkleDropTrancheActive({
    chainId,
    args: [trancheId],
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
      assert(typeof amount === 'number' && amount > 0, 'Invalid amount')
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
                // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
                args: [sender!, trancheId, BigInt(index!), BigInt(amount!), merkleProof!],
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
  })

  const {
    data: trancheActive,
    isLoading: isLoadingTrancheActive,
    error: errorTrancheActive,
  } = useReadSendMerkleDropTrancheActive({
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
      ? // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
        [address!, trancheId, BigInt(index!), BigInt(amount!), merkleProof!]
      : undefined,
  })
}
