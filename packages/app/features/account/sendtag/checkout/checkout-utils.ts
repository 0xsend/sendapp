import { useQuery } from '@tanstack/react-query'
import { reward } from 'app/data/sendtags'
import { assert } from 'app/utils/assert'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { fetchProfile } from 'app/utils/useProfileLookup'

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

export function useReferrer() {
  const supabase = useSupabase()
  const { data: referralCode } = useReferralCode()
  return useQuery({
    queryKey: ['referrer', { referralCode, supabase }] as const,
    queryFn: async ({ queryKey: [, { referralCode, supabase }], signal }) => {
      assert(!!referralCode, 'referralCode is required')
      const { data, error } = await fetchProfile({
        supabase,
        lookup_type: 'refcode',
        identifier: referralCode,
      })
        .abortSignal(signal)
        .maybeSingle()
      if (error) {
        if (error.code === 'PGRST116') {
          // no rows found
          return null
        }
        throw error
      }
      return data
    },
    enabled: !!referralCode,
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
