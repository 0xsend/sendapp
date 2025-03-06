import type { Tables } from '@my/supabase/database-generated.types'
import { useUser } from './useUser'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { assert } from './assert'
import { useSupabase } from './supabase/useSupabase'
import { fetchProfile } from './useProfileLookup'
import { getCookie } from './cookie'

export const REFERRAL_COOKIE_NAME = 'referral'
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

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
  ] as const)
  const referrer = ([profileByReferralCode, profileByTag] as const).find((p) => {
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
