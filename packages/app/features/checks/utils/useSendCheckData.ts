import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { baseMainnetClient, sendCheckAbi, sendCheckAddress } from '@my/wagmi'
import { type Hex, getContract } from 'viem'
import type { SendCheckData } from 'app/features/checks/types'

export const useSendCheckData = (
  ephemeralAddress: Hex,
  queryProps?
): UseQueryResult<SendCheckData> => {
  return useQuery({
    queryKey: ['sendCheckData'],
    queryFn: () => getSendCheckData(ephemeralAddress),
    ...queryProps,
  })
}

const getSendCheckData = async (ephemeralAddress: Hex): Promise<SendCheckData> => {
  const sendChecks = getContract({
    address: sendCheckAddress[baseMainnetClient.chain.id] as Hex,
    abi: sendCheckAbi,
    client: baseMainnetClient,
  })
  return await sendChecks.read.getCheck([ephemeralAddress])
}
