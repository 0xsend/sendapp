import { sendEarnAffiliateAbi } from '@0xsend/send-earn-contracts'
import type { Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMyAffiliateRewards, useMyAffiliateVault } from 'app/features/earn/hooks'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import type { SendAccountCall } from 'app/utils/userop'
import debug from 'debug'
import { useCallback } from 'react'
import { encodeFunctionData } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'
import type { ZodError } from 'zod'
import { SendEarnActivitySchemaArray, type SendEarnActivity } from '../../zod'

const log = debug('app:features:earn:rewards')

/**
 * Hook to create a send account calls for claiming affiliate rewards from
 * Send Earn vaults.
 *
 * It will return send account calls for withdrawing affiliate rewards from a Send Earn vault.
 *
 * @param {Object} params - The claim parameters
 * @param {string} params.sender - The address of the sender
 * @returns {UseQueryReturnType<SendAccountCall[], Error>} The SendAccountCalls
 */
export function useSendEarnClaimRewardsCalls({
  sender,
}: {
  sender: `0x${string}` | undefined
}): UseQueryReturnType<SendAccountCall[] | null, Error> {
  const affiliateRewards = useMyAffiliateRewards()
  const sendAccount = useSendAccount()

  return useQuery({
    queryKey: ['sendEarnClaimRewardsCalls', { sender, affiliateRewards, sendAccount }] as const,
    enabled: affiliateRewards.isFetched && sendAccount.isFetched && sender !== undefined,
    queryFn: async (): Promise<SendAccountCall[] | null> => {
      throwIf(affiliateRewards.error)
      throwIf(sendAccount.error)
      assert(sender !== undefined, 'Sender is not defined')

      if (!affiliateRewards.data) {
        log('No affiliate rewards found to claim')
        return null
      }

      const { assets, vault } = affiliateRewards.data

      // If there are no shares to claim or vault is null, return null
      if (!vault || !vault.send_earn_affiliate_vault) {
        log('invalid affiliate vault', { assets, vault })
        return null
      }

      if (assets <= 0n) {
        log('no affiliate rewards to claim', { assets, vault })
        return null
      }

      log('Claiming affiliate rewards', { assets, vault })

      // For claiming rewards, we need to call the pay function on the send earn affilate contract
      // This will split the fees between the Platform and Affiliate, depositing it into
      // the payVault for the affiliate
      return [
        {
          dest: vault.send_earn_affiliate,
          value: 0n,
          data: encodeFunctionData({
            abi: sendEarnAffiliateAbi,
            functionName: 'pay',
            args: [vault.send_earn_affiliate_vault.send_earn],
          }),
        },
      ]
    },
  })
}

/**
 * Infinite query to fetch Send Earn Affiliate rewards activity.
 *
 * @param params.pageSize - Number of items to fetch per page
 * @param params.refetchInterval - Interval in ms to refetch data
 * @param params.enabled - Whether the query is enabled
 */
export function useSendEarnRewardsActivity(params?: {
  pageSize?: number
  refetchInterval?: number
  enabled?: boolean
}): UseInfiniteQueryResult<InfiniteData<SendEarnActivity[]>, PostgrestError | ZodError> {
  const { pageSize = 10, refetchInterval = 30_000, enabled = true } = params ?? {}
  const supabase = useSupabase()
  const myAffiliateVault = useMyAffiliateVault()

  const fetchSendEarnActivity = useCallback(
    async ({
      pageParam,
      supabase,
      pageSize,
      sender,
    }: {
      pageParam: number
      supabase: SupabaseClient<Database>
      pageSize: number
      sender: `0x${string}`
    }): Promise<SendEarnActivity[]> => {
      const from = pageParam * pageSize
      const to = (pageParam + 1) * pageSize - 1

      const { data, error } = await supabase
        .from('send_earn_activity')
        .select('type,block_num,block_time,log_addr,owner,sender,assets::text,shares::text,tx_hash')
        .eq('sender', hexToBytea(sender))
        .order('block_time', { ascending: false })
        .range(from, to)

      if (error) throw error
      return SendEarnActivitySchemaArray.parse(data)
    },
    []
  )

  const queryKey = [
    'send_earn_affiliate_rewards_activity',
    { supabase, pageSize, myAffiliateVault },
  ] as const
  return useInfiniteQuery<
    SendEarnActivity[],
    PostgrestError | ZodError,
    InfiniteData<SendEarnActivity[], number>,
    typeof queryKey,
    number
  >({
    queryKey,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage !== null && lastPage.length < pageSize) return undefined
      return lastPageParam + 1
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
      if (firstPageParam <= 1) {
        return undefined
      }
      return firstPageParam - 1
    },
    queryFn: ({
      pageParam,
      queryKey: [, { supabase, pageSize, myAffiliateVault }],
    }): Promise<SendEarnActivity[]> => {
      assert(!!myAffiliateVault.data?.send_earn_affiliate, 'No affiliate vault found')
      return fetchSendEarnActivity({
        supabase,
        pageSize,
        sender: myAffiliateVault.data.send_earn_affiliate,
        pageParam,
      })
    },
    refetchInterval,
    enabled: enabled && (myAffiliateVault.isSuccess || myAffiliateVault.isError),
  })
}
