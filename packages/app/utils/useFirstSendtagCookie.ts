import { getCookie, setCookie } from 'app/utils/cookie'
import { useQuery } from '@tanstack/react-query'

const COOKIE_NAME = 'firstSendtag'
const COOKIE_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days
const QUERY_KEY = 'firstSendtag'

export const setFirstSendtagCookie = (value: string) => {
  setCookie(COOKIE_NAME, value, COOKIE_AGE)
}

export const useFirstSendtagCookie = () => {
  return useQuery({
    queryKey: [QUERY_KEY] as const,
    queryFn: () => getCookie(COOKIE_NAME),
  })
}

useFirstSendtagCookie.queryKey = QUERY_KEY
