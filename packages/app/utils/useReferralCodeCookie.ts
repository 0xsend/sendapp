import { useQuery } from '@tanstack/react-query'

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

export function useReferralCodeCookie() {
  return useQuery({
    queryKey: ['referralCode'] as const,
    queryFn: () => getCookie(REFERRAL_COOKIE_NAME),
  })
}
