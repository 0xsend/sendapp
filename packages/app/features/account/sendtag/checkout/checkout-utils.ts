import type { Tables } from '@my/supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { reward } from 'app/data/sendtags'
import { assert } from 'app/utils/assert'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { fetchProfile } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'

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
    queryFn: () => getCookie(REFERRAL_COOKIE_NAME),
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

  const referrer = [profileByTag, profileByReferralCode].find((p) => {
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
