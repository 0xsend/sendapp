import { sendEarnAffiliateAbi } from '@0xsend/send-earn-contracts'
import type { Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMyAffiliateRewards, useMyAffiliateVault } from 'app/features/earn/hooks'
import { getBaseAddressFilterCondition, parseAndProcessActivities } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useAddressBook, type AddressBook } from 'app/utils/useAddressBook'
import type { SendAccountCall } from 'app/utils/userop'
import { DatabaseEvents, type Activity } from 'app/utils/zod/activity'
import debug from 'debug'
import { useMemo } from 'react'
import { encodeFunctionData } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'
import type { ZodError } from 'zod'

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
 * Fetches the Send Earn Affiliate rewards activity feed for the current user.
 */
export function useEarnRewardsActivityFeed(params?: {
  pageSize?: number
  refetchInterval?: number
  enabled?: boolean
}): UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError> {
  const { pageSize = 10, refetchInterval = 30000, enabled: enabledProp = true } = params ?? {}
  const supabase = useSupabase()
  const addressBook = useAddressBook()
  const sendAccount = useSendAccount()
  const { data: sendAccountData } = sendAccount
  const myAffiliateVault = useMyAffiliateVault()

  const enabled = useMemo(
    () =>
      enabledProp &&
      (addressBook.isError || addressBook.isSuccess) &&
      (sendAccount.isSuccess || sendAccount.isError) &&
      (myAffiliateVault.isSuccess || myAffiliateVault.isError),
    [enabledProp, addressBook, sendAccount, myAffiliateVault]
  )

  const queryKey = useMemo(
    () =>
      [
        'earn_rewards_activity_feed',
        { addressBook, supabase, pageSize, sendAccount, sendAccountData, myAffiliateVault },
      ] as const,
    [addressBook, supabase, pageSize, sendAccount, sendAccountData, myAffiliateVault]
  )

  return useInfiniteQuery<
    Activity[],
    PostgrestError | ZodError,
    InfiniteData<Activity[], number>,
    typeof queryKey,
    number
  >({
    enabled,
    queryKey,
    refetchInterval,
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
    queryFn: async ({
      queryKey: [
        ,
        { addressBook, supabase, pageSize, sendAccount, sendAccountData, myAffiliateVault },
      ],
      pageParam,
    }) => {
      throwIf(addressBook.error)
      throwIf(sendAccount.error)
      throwIf(myAffiliateVault.error)
      assert(!!addressBook.data, 'Fetching address book failed')
      assert(!!sendAccountData, 'Fetching send account failed')

      // Only proceed if we have an affiliate vault
      if (!myAffiliateVault.data?.send_earn_affiliate) {
        return [] // Return empty array if no affiliate vault found
      }

      return await fetchEarnRewardsActivityFeed({
        pageParam,
        supabase,
        pageSize,
        addressBook: addressBook.data,
        userAddress: sendAccountData.address,
        sendEarnAffiliate: myAffiliateVault.data.send_earn_affiliate, // Pass the affiliate address
      })
    },
  })
} /**
 * Fetches the Send Earn rewards activity feed for the current user.
 * This queries the activity_feed view with filters to identify Send Earn rewards related activities.
 */

export async function fetchEarnRewardsActivityFeed({
  pageParam,
  addressBook,
  supabase,
  pageSize,
  sendEarnAffiliate,
}: {
  pageParam: number
  addressBook: AddressBook
  supabase: SupabaseClient<Database>
  pageSize: number
  userAddress: `0x${string}`
  sendEarnAffiliate: `0x${string}`
}): Promise<Activity[]> {
  const from = pageParam * pageSize
  const to = (pageParam + 1) * pageSize - 1

  const query = supabase
    .from('activity_feed')
    .select('*')
    .in('event_name', [DatabaseEvents.SendEarnDeposit])
    .eq('data->>sender', hexToBytea(sendEarnAffiliate))
    .or(getBaseAddressFilterCondition())
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error } = await query
  throwIf(error)

  // Parse and process the raw data
  return parseAndProcessActivities(data, {
    addressBook,
  })
}
