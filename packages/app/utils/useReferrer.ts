import type { Database, Tables } from '@my/supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase } from './supabase/useSupabase'
import { useUser } from './useUser'
import { useQuery } from '@tanstack/react-query'
import { assert } from './assert'
import { useReferralCodeCookie } from './useReferralCodeCookie'

/**
 * Fetches the referrer profile of existing referrer. Takes an optional identifier in case the user has no existing referrer./
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
  referral_code,
  signal,
}: {
  supabase: SupabaseClient<Database>
  profile: Tables<'profiles'>
  referral_code?: string
  signal?: AbortSignal
}) {
  const signalToUse = signal ?? new AbortController().signal
  const { data, error: referrerError } = await supabase
    .rpc('referrer_lookup', { referral_code })
    .select('*')
    .abortSignal(signalToUse)
    .single()

  if (referrerError && referrerError.code !== 'PGRST116') throw referrerError
  if (!data) return null

  const { referrer, new_referrer } = data
  switch (true) {
    case !!referrer && referrer.sendid !== null:
      return { ...referrer, isNew: false }
    case !!new_referrer && new_referrer.refcode === profile.referral_code:
      return null // no self referrals
    case !!new_referrer && new_referrer.sendid !== null:
      return { ...new_referrer, isNew: true }
    default:
      return null
  }
}

export function useReferrer() {
  const supabase = useSupabase()
  const { profile } = useUser()
  const { data: referralCodeCookie, isLoading } = useReferralCodeCookie()

  return useQuery({
    queryKey: ['referrer', { referralCodeCookie, supabase, profile }] as const,
    queryFn: async ({ queryKey: [, { referralCodeCookie, supabase, profile }], signal }) => {
      assert(!!supabase, 'supabase is required')
      assert(!!profile, 'profile is required')
      return fetchReferrer({
        supabase,
        profile,
        referral_code: referralCodeCookie,
        signal,
      })
    },
    enabled: !!profile && !isLoading,
  })
}
