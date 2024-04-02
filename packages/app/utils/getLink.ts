import { getBaseUrl } from './getBaseUrl'

export const getShareableLink = (linkType: string, Code: string) => {
  let baseUrl = getBaseUrl()

  if (!baseUrl && typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }

  return `${baseUrl}/${linkType}/${Code}`
}

export const getXPostHref = (referralCode: string) => {
  return `http://x.com/share?text=Just reserved my Sendtag $send&url=${getShareableLink(
    'referrer',
    referralCode
  )}&hashtags=send`
}
