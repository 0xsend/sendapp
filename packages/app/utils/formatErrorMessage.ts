export const formatErrorMessage = (error: Error) => {
  const message = error.message || ''
  const statusCode = error?.response?.status || error?.status
  const url = error?.response?.url || error?.config?.url || ''

  // Network security blocking
  if (statusCode >= 400 && statusCode < 500) {
    if (url.includes('cloudflare')) {
      return 'Cloudflare is blocking this request. Try disabling your VPN or switching networks.'
    }
    if (url.includes('send.app')) {
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
