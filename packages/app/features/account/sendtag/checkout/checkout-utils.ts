import type { Database } from '@my/supabase/database.types'
import {
  baseMainnetClient,
  sendtagCheckoutAbi,
  sendtagCheckoutAddress,
  usdcAddress,
} from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reward, total } from 'app/data/sendtags'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { usePendingTags } from 'app/utils/tags'
import { throwIf } from 'app/utils/throwIf'
import { useReferrer } from 'app/utils/useReferrer'
import { useUserOp } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { fetchSendtagCheckoutReceipts } from './checkout-utils.fetchSendtagCheckoutReceipts'

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.

Send.it`

export function useReferralReward({ tags }: { tags: { name: string }[] }) {
  const { data: referrer } = useReferrer()
  return useQuery({
    queryKey: ['reward', { referrer, tags }] as const,
    queryFn: async ({ queryKey: [, { referrer, tags }] }) => {
      if (!referrer) return 0n
      return tags.reduce((acc, tag) => acc + reward(tag.name.length), 0n)
    },
    enabled: !!referrer,
  })
}

function sendtagCheckoutReceiptsQueryOptions(supabase: SupabaseClient<Database>) {
  return queryOptions({
    queryKey: ['sendtag_checkout_transfers', supabase] as const,
    queryFn: async ({ queryKey: [, supabase] }) => {
      const { data, error } = await fetchSendtagCheckoutReceipts(supabase)
      throwIf(error)
      return data
    },
    refetchInterval: 1000 * 10,
  })
}

export function useSendtagCheckoutReceipts() {
  const supabase = useSupabase()
  return useQuery(sendtagCheckoutReceiptsQueryOptions(supabase))
}

export const useReleaseTag = () => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagName: string) => {
      const { error } = await supabase.from('tags').delete().eq('name', tagName)

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useSendtagCheckout() {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const chainId = baseMainnetClient.chain.id
  const pendingTags = usePendingTags() ?? []
  const amountDue = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const { data: referrer } = useReferrer()
  const { data: reward } = useReferralReward({ tags: pendingTags })
  const referrerAddress = (referrer?.address ?? zeroAddress) as `0x${string}`

  const checkoutArgs = useMemo(
    () => [amountDue, referrerAddress, reward ?? 0n] as const,
    [amountDue, referrerAddress, reward]
  )
  const calls = useMemo(
    () => [
      {
        dest: usdcAddress[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [sendtagCheckoutAddress[chainId], amountDue],
        }),
      },
      {
        dest: sendtagCheckoutAddress[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: sendtagCheckoutAbi,
          functionName: 'checkout',
          args: checkoutArgs,
        }),
      },
    ],
    [amountDue, chainId, checkoutArgs]
  )
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useUserOp({
    sender,
    calls,
  })
  const {
    data: usdcFees,
    isLoading: isLoadingUSDCFees,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })
  return {
    userOp,
    userOpError,
    isLoadingUserOp,
    usdcFees,
    usdcFeesError,
    isLoadingUSDCFees,
  }
}
