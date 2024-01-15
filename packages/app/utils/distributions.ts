import { Tables, Views } from '@my/supabase/database.types'
import {
  sendAddress,
  sendAirdropsSafeAddress,
  sendMerkleDropABI,
  sendMerkleDropAddress,
  sendUniswapV3PoolAddress,
} from '@my/wagmi'
import { PostgrestError } from '@supabase/supabase-js'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useBalance, useChainId, useContractRead, usePrepareContractWrite } from 'wagmi'
import { api } from './api'

export const DISTRIBUTION_INITIAL_POOL_AMOUNT = BigInt(20e9)

type UseDistributionResultDistribution = Omit<
  Tables<'distributions'>,
  'qualification_end' | 'qualification_start' | 'claim_end'
>

export type UseDistributionsResultData = (UseDistributionResultDistribution & {
  qualification_end: Date
  qualification_start: Date
  claim_end: Date
  distribution_shares: Tables<'distribution_shares'>[]
  distribution_verifications_summary: Views<'distribution_verifications_summary'>[]
})[]

export const useDistributions = (): UseQueryResult<UseDistributionsResultData, PostgrestError> => {
  const supabase = useSupabase()
  return useQuery(['distributions'], {
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select('*, distribution_shares(*), distribution_verifications_summary(*)')

      if (error) {
        throw error
      }

      return data.map((distribution) => ({
        ...distribution,
        qualification_end: new Date(distribution.qualification_end),
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
  const chainId = useChainId() as keyof typeof sendAddress
  return useBalance({
    watch: true,
    address,
    token: sendAddress[chainId],
    enabled: !!address,
  })
}

export const useSendDistributionCurrentPoolTotal = () =>
  useSendTokenBalance(sendAirdropsSafeAddress)

export const useSendSellCountDuringDistribution = (
  distribution: UseDistributionsResultData[number]
): UseQueryResult<Tables<'send_transfer_logs'>[], Error> => {
  const supabase = useSupabase()
  return useQuery(['distributions', 'send_transfer_logs', distribution.id], {
    queryFn: async () => {
      const { data, error } = await supabase
        .from('send_transfer_logs')
        .select('*', { count: 'exact' })
        .eq('to', sendUniswapV3PoolAddress)
        .gte('block_timestamp', distribution.qualification_start.toISOString())
        .lte('block_timestamp', distribution.qualification_end.toISOString())

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
export const useSendMerkleDropTrancheActive = (tranche: bigint) => {
  const chainId = useChainId() as keyof typeof sendMerkleDropAddress
  return useContractRead({
    abi: sendMerkleDropABI,
    functionName: 'trancheActive',
    address: sendMerkleDropAddress[chainId],
    args: [tranche],
  })
}

/**
 * @param tranche The tranche to query. 0-indexed.
 * @param index The index of the claim in the tranche to query. 0-indexed.
 * @returns Whether the claim has been claimed by the user.
 */
export const useSendMerkleDropIsClaimed = (tranche: bigint, index?: bigint) => {
  const chainId = useChainId() as keyof typeof sendMerkleDropAddress
  return useContractRead({
    abi: sendMerkleDropABI,
    functionName: 'isClaimed',
    address: sendMerkleDropAddress[chainId],
    // biome-ignore lint/style/noNonNullAssertion: we know index is defined when enabled is true
    args: [tranche, index!],
    enabled: index !== undefined,
  })
}

type SendMerkleDropClaimTrancheArgs = {
  distribution: UseDistributionsResultData[number]
  share?: UseDistributionsResultData[number]['distribution_shares'][number]
}

export const usePrepareSendMerkleDropClaimTrancheWrite = ({
  distribution,
  share,
}: SendMerkleDropClaimTrancheArgs) => {
  const chainId = useChainId() as keyof typeof sendMerkleDropAddress
  // get the merkle proof from the database
  const {
    data: merkleProof,
    isLoading: isLoadingProof,
    error: errorProof,
  } = api.distribution.proof.useQuery({ distributionId: distribution.id })
  const { address, amount, index } = share ?? {}
  const enabled =
    !isLoadingProof &&
    !errorProof &&
    merkleProof !== undefined &&
    index !== undefined &&
    amount !== undefined &&
    address !== undefined

  return usePrepareContractWrite({
    abi: sendMerkleDropABI,
    functionName: 'claimTranche',
    chainId,
    address: sendMerkleDropAddress[chainId],
    account: address,
    enabled,
    // claimTranche(
    //     address _address,
    //     uint256 _tranche,
    //     uint256 _index,
    //     uint256 _amount,
    //     bytes32[] memory _merkleProof
    // )
    args: enabled
      ? // biome-ignore lint/style/noNonNullAssertion: we know address, index, amount, and merkleProof are defined when enabled is true
        [address!, BigInt(distribution.number - 1), BigInt(index!), BigInt(amount!), merkleProof!]
      : undefined,
  })
}
