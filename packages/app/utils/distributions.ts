import { Tables, Views } from '@my/supabase/database.types'
import {
  mainnet,
  sendTokenAddress,
  sendAirdropsSafeAddress,
  sendMerkleDropAbi,
  sendMerkleDropAddress,
  sendUniswapV3PoolAddress,
  useReadSendMerkleDropTrancheActive,
} from '@my/wagmi'
import { PostgrestError } from '@supabase/supabase-js'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useBalance, useChainId, useReadContract, useSimulateContract } from 'wagmi'
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
  return useQuery({
    queryKey: ['distributions'],
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
): UseQueryResult<Tables<'send_transfer_logs'>[], Error> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['distributions', 'send_transfer_logs', distribution.id],
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
  return useReadContract({
    abi: sendMerkleDropAbi,
    functionName: 'trancheActive',
    address: sendMerkleDropAddress[mainnet.id],
    args: [tranche],
  })
}

/**
 * @param tranche The tranche to query. 0-indexed.
 * @param index The index of the claim in the tranche to query. 0-indexed.
 * @returns Whether the claim has been claimed by the user.
 */
export const useSendMerkleDropIsClaimed = (tranche: bigint, index?: bigint) => {
  return useReadContract({
    abi: sendMerkleDropAbi,
    functionName: 'isClaimed',
    address: sendMerkleDropAddress[mainnet.id],
    // biome-ignore lint/style/noNonNullAssertion: we know index is defined when enabled is true
    args: [tranche, index!],
    query: {
      enabled: index !== undefined,
    },
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
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
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
  } = useSendMerkleDropIsClaimed(
    trancheId,
    share?.index !== undefined ? BigInt(share.index) : undefined
  )

  const {
    data: trancheActive,
    isLoading: isLoadingTrancheActive,
    error: errorTrancheActive,
  } = useReadSendMerkleDropTrancheActive({ args: [trancheId] })

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
    chainId: mainnet.id,
    address: sendMerkleDropAddress[mainnet.id],
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
