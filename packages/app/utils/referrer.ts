import type { Tables } from '@my/supabase/database-generated.types'
import type { Database, Functions } from '@my/supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import type { Merge } from 'type-fest'
import { assert } from './assert'
import { getCookie } from './cookie'
import { useSupabase } from './supabase/useSupabase'
import { throwIf } from './throwIf'
import { fetchProfile } from './useProfileLookup'
import { useUser } from './useUser'

export const REFERRAL_COOKIE_NAME = 'referral'
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

export function useReferralCode() {
  return useQuery({
    queryKey: ['referralCode'] as const,
    queryFn: () => getCookie(REFERRAL_COOKIE_NAME) || null,
  })
}

type ReferrerProfile = Merge<Functions<'profile_lookup'>[number], { address: `0x${string}` }>

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
}): Promise<ReferrerProfile | null> {
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
    return referrer as ReferrerProfile // safe because we filter out referrers with no address and tag
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
  const referralCode = useReferralCode()
  return useQuery({
    queryKey: ['referrer', { referralCode, supabase, profile }] as const,
    queryFn: async ({ queryKey: [, { referralCode, supabase, profile }], signal }) => {
      throwIf(referralCode.error)
      if (!referralCode.data) return null
      assert(!!supabase, 'supabase is required')
      assert(!!profile, 'profile is required')
      return fetchReferrer({ supabase, profile, referralCode: referralCode.data, signal })
    },
    enabled: !!profile && referralCode.isFetched,
  })
}

/**
 * Returns profile information about who referred the current user
 */
export function fetchReferredBy({ supabase }: { supabase: SupabaseClient<Database> }) {
  return supabase.from('referrer').select('*')
}

/**
 * Returns profile information about who referred the current user
 */
export function useReferredBy() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['referredBy', { supabase }] as const,
    queryFn: async ({ queryKey: [, { supabase }], signal }) => {
      assert(!!supabase, 'supabase is required')
      const { data, error } = await fetchReferredBy({ supabase }).abortSignal(signal).maybeSingle()
      if (error) {
        if (error.code === 'PGRST116') {
          // no rows found
          return null
        }
        throw error
      }
      return data
    },
  })
}
