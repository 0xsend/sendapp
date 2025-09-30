export const formatErrorMessage = (error: unknown) => {
  type Httpish = {
    message?: string
    status?: number
    response?: { status?: number; url?: string }
    config?: { url?: string }
    meta?: { response?: Response; responseJSON?: unknown }
    cause?: unknown
  }
  const e = (error as Httpish) || {}
  const message = e.message || ''

  const response = e.meta?.response ?? e.response
  const statusCode = response?.status ?? e.status
  const url = response?.url || e.config?.url || ''
  const urlLower = url.toLowerCase()
  const configUrlLower = e.config?.url ? e.config.url.toLowerCase() : ''

  const headers = (() => {
    if (!response) return undefined
    const resWithHeaders = response as { headers?: Headers }
    if (!resWithHeaders.headers) return undefined
    const candidate = resWithHeaders.headers
    return typeof candidate.get === 'function' ? candidate : undefined
  })()

  const serverHeader = headers?.get('server')?.toLowerCase() || ''
  const hasCfRay = headers?.has('cf-ray') ?? false
  const hasCfCacheStatus = headers?.has('cf-cache-status') ?? false
  const hasCfRequestId = headers?.has('cf-request-id') ?? false

  const causeMessage = (() => {
    const cause = e.cause
    if (!cause) return ''
    if (typeof cause === 'string') return cause
    if (typeof (cause as { message?: string }).message === 'string') {
      return (cause as { message?: string }).message ?? ''
    }
    return ''
  })()

  const combinedMessage = `${message} ${causeMessage}`.toLowerCase()

  const isCloudflareUrl = urlLower.includes('cloudflare') || configUrlLower.includes('cloudflare')
  const isCloudflareHeaders =
    serverHeader.includes('cloudflare') || hasCfRay || hasCfCacheStatus || hasCfRequestId
  const isCloudflareNetworkError =
    (combinedMessage.includes('err_connection') || combinedMessage.includes('err_network')) &&
    (combinedMessage.includes('cloudflare') || isCloudflareUrl)

  if (isCloudflareUrl || isCloudflareHeaders || isCloudflareNetworkError) {
    return 'Cloudflare is blocking this request. Try disabling your VPN then reload with Ctrl+R, or use an incognito window for signup.'
  }

  // Network security blocking
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    if (urlLower.includes('send.app')) {
      return `Send servers are blocking this request. Try Ctrl+R and/or disabling VPN. Error: ${message}`
    }
  }

  if (message.includes('ERR_NETWORK') || message.includes('Failed to fetch')) {
    return 'Network connectivity issues detected. This may be due to firewall restrictions.'
  }

  // Check for passkey errors
  if (
    message?.startsWith('The operation either timed out or was not allowed') ||
    message?.startsWith(
      'The request is not allowed by the user agent or the platform in the current context'
    )
  ) {
    return 'Passkey Authentication Failed'
  }

  return message
}
