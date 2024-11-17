import type { Database, Tables } from '@my/supabase/database.types'
import {
  baseMainnetClient,
  sendtagCheckoutAbi,
  sendtagCheckoutAddress,
  usdcAddress,
} from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { reward, total } from 'app/data/sendtags'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { usePendingTags } from 'app/utils/tags'
import { throwIf } from 'app/utils/throwIf'
import { fetchProfile } from 'app/utils/useProfileLookup'
import { useUserOp } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useUser } from 'app/utils/useUser'
import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { fetchSendtagCheckoutReceipts } from './checkout-utils.fetchSendtagCheckoutReceipts'

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.

Send.it`

export const REFERRAL_COOKIE_NAME = 'referral'
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

export function setCookie(name: string, value: string, maxAge: number): void {
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/;`
}

export function useReferralCode() {
  return useQuery({
    queryKey: ['referralCode'] as const,
    queryFn: () => getCookie(REFERRAL_COOKIE_NAME) || null,
  })
}
/**
 * Fetches the referrer profile by referral code or tag.
 * If the referrer is the same as the profile, returns null. The referrer should also have a send account and sendtag.
 * @param supabase
 * @param profile
 * @param referralCode
 * @param signal
 * @returns The referrer profile or null if the referrer is the same as the profile.
 */
export async function fetchReferrer({
  supabase,
  profile,
  referralCode,
  signal,
}: {
  supabase: SupabaseClient
  profile: Tables<'profiles'>
  referralCode: string
  signal?: AbortSignal
}) {
  if (profile?.referral_code === referralCode) return null // no self referrals
  const signalToUse = signal ?? new AbortController().signal
  const [
    { data: profileByReferralCode, error: errorByReferralCode },
    { data: profileByTag, error: errorByTag },
  ] = await Promise.all([
    fetchProfile({
      supabase,
      lookup_type: 'refcode',
      identifier: referralCode,
    })
      .abortSignal(signalToUse)
      .maybeSingle(),
    fetchProfile({
      supabase,
      lookup_type: 'tag',
      identifier: referralCode,
    })
      .abortSignal(signalToUse)
      .maybeSingle(),
  ])

  const referrer = [profileByReferralCode, profileByTag].find((p) => {
    if (!p) return false
    if (p.id === profile.id) return false // no self referrals
    if (!p.address) return false // need a send account
    if (!p.tag) return false // need a sendtag
    return true // found a valid referrer
  })

  if (referrer) {
    return referrer
  }

  if (errorByReferralCode) {
    if (errorByReferralCode.code !== 'PGRST116') {
      throw errorByReferralCode
    }
  }

  if (errorByTag) {
    if (errorByTag.code !== 'PGRST116') {
      throw errorByTag
    }
  }
  return null
}

export function useReferrer() {
  const supabase = useSupabase()
  const { profile } = useUser()
  const { data: referralCode } = useReferralCode()
  return useQuery({
    queryKey: ['referrer', { referralCode, supabase, profile }] as const,
    queryFn: async ({ queryKey: [, { referralCode, supabase, profile }], signal }) => {
      assert(!!referralCode, 'referralCode is required')
      assert(!!supabase, 'supabase is required')
      assert(!!profile, 'profile is required')
      return fetchReferrer({ supabase, profile, referralCode, signal })
    },
    enabled: !!referralCode && !!profile,
  })
}

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

export function useSendtagCheckout() {
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const chainId = baseMainnetClient.chain.id
  const pendingTags = usePendingTags() ?? []
  const amountDue = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const { data: referrer } = useReferrer()
  const {
    data: referred,
    isLoading: isLoadingReferred,
    error: referredError,
  } = api.referrals.getReferred.useQuery()
  const { data: reward } = useReferralReward({ tags: pendingTags })
  const referrerAddress = referred?.referrerSendAccount?.address ?? referrer?.address ?? zeroAddress

  const checkoutArgs = useMemo(
    () => [amountDue, referrerAddress ?? zeroAddress, reward ?? 0n] as const,
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
    isLoadingReferred,
    referredError,
  }
}
