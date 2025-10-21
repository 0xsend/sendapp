import getBaseUrl from './getBaseUrl'
import { Platform } from 'react-native'

export const getReferralHref = (referralCode: string) => {
  let baseUrl = getBaseUrl()

  if (!baseUrl && Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }

  return `${baseUrl}/?referral=${referralCode}`
}

export const getXPostHref = (referralCode: string) => {
  return `http://x.com/share?text=Just reserved my Sendtag $send&url=${getReferralHref(
    referralCode
  )}&hashtags=send`
}
