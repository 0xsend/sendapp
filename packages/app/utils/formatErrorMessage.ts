const extractCloudflareErrorInfo = (
  statusCode: number | undefined,
  headers: Headers | undefined,
  responseJSON: unknown
): { cfRay: string; errorCode: string | null; message: string } | null => {
  if (statusCode !== 403) return null

  const serverHeader = headers?.get('server')?.toLowerCase() || ''
  const isCloudflareServer = serverHeader.includes('cloudflare')
  const cfRay = headers?.get('cf-ray')

  if (!isCloudflareServer && !cfRay) return null

  let errorCode: string | null = null
  const responseBody =
    typeof responseJSON === 'string' ? responseJSON : JSON.stringify(responseJSON || '')

  const errorCodeMatch = responseBody.match(/Error code:\s*(10\d{2})/i)
  if (errorCodeMatch?.[1]) {
    errorCode = errorCodeMatch[1]
  } else {
    const cfErrorCodeMatch = responseBody.match(/cf-error-code['"]?>(\d{4})/i)
    if (cfErrorCodeMatch?.[1]?.startsWith('10')) {
      errorCode = cfErrorCodeMatch[1]
    }
  }

  const hasCloudflareHtml =
    responseBody.includes('cf-error-code') ||
    responseBody.includes('cf-error-details') ||
    responseBody.toLowerCase().includes('cloudflare')

  if (!isCloudflareServer && !hasCloudflareHtml) {
    return null
  }

  const errorMessages: Record<string, string> = {
    '1006': 'Your IP address has been banned',
    '1007': 'Your IP address has been banned',
    '1008': 'Your IP address has been banned',
    '1009': 'Access denied: Country or region banned',
    '1010': 'Access denied: Browser signature blocked',
    '1015': 'Rate limited: Too many requests',
    '1020': 'Access denied: Blocked by security rules',
  }

  const specificMessage = errorCode ? errorMessages[errorCode] : null
  const rayIdText = cfRay ? ` Ray ID: ${cfRay}` : ''
  const message = specificMessage
    ? `Cloudflare blocked this request: ${specificMessage}.${rayIdText}`
    : `Cloudflare blocked this request. Try disabling your VPN then reload with Ctrl+R, or use an incognito window for signup.${rayIdText}`

  return { cfRay: cfRay || '', errorCode, message }
}

export const formatErrorMessage = (error: unknown) => {
  type Httpish = {
    message?: string
    status?: number
    response?: { status?: number; url?: string; headers?: Headers }
    config?: { url?: string }
    meta?: { response?: Response; responseJSON?: unknown }
  }
  const e = error as Httpish
  const message = e?.message || ''

  const response = e?.meta?.response ?? e?.response
  const statusCode = response?.status ?? e?.status
  const url = response?.url || e?.config?.url || ''
  const urlLower = url.toLowerCase()

  const headers = response && 'headers' in response ? response.headers : undefined
  const cfError = extractCloudflareErrorInfo(statusCode, headers, e?.meta?.responseJSON)
  if (cfError) {
    return cfError.message
  }

  if ((statusCode === 401 || statusCode === 403) && urlLower.includes('send.app')) {
    return `Send servers are blocking this request. Try Ctrl+R and/or disabling VPN. Error: ${message}`
  }

  if (message.includes('ERR_NETWORK') || message.includes('Failed to fetch')) {
    return 'Network connectivity issues detected. This may be due to firewall restrictions.'
  }

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
