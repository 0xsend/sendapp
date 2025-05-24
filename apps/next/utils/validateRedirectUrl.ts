const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
const BASE_ORIGIN = new URL(BASE_URL).origin

/**
 * Validates a redirect URL to ensure it's safe and belongs to the same origin
 * @param redirectUri - The redirect URI to validate
 * @returns The validated path or '/' if invalid
 */
export function validateRedirectUrl(redirectUri: string | undefined): string {
  if (!redirectUri || typeof redirectUri !== 'string') {
    return '/'
  }

  try {
    const decodedUri = decodeURIComponent(redirectUri)

    // Only allow relative paths that start with / (but not //)
    if (decodedUri.startsWith('/') && !decodedUri.startsWith('//')) {
      // Parse the URL to validate and sanitize it
      const url = new URL(decodedUri, BASE_URL)

      // Ensure the URL is still pointing to the same origin
      if (url.origin === BASE_ORIGIN) {
        return url.pathname + url.search + url.hash
      }
    }
  } catch {
    // Any error in processing means we use the default destination
    console.warn(`Invalid redirect URI provided redirectUri=${redirectUri}`)
  }

  return '/'
}
