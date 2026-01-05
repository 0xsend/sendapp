/**
 * Sanitize URLs to redact sensitive data before sending to analytics
 *
 * Check codes are private keys encoded as Base32 with dashes (e.g., XXXX-XXXX-...).
 * These must be redacted from pageview/screen tracking to prevent exposure.
 */

// Match /check/claim/CODE or /check/public/CODE patterns
// Check codes are Base32: A-Z, 2-7, with dashes every 4 chars
// Example: ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ23-4567-ABCD-EFGH-IJKL-MN
const CHECK_CODE_PATTERN = /\/check\/(claim|public)\/[A-Z2-7]+(?:-[A-Z2-7]+)*/gi

const REDACTED_PLACEHOLDER = '[REDACTED]'

/**
 * Sanitize a URL path by redacting sensitive check codes
 */
export function sanitizePath(path: string): string {
  return path.replace(CHECK_CODE_PATTERN, (match) => {
    // Extract the route type (claim or public) from the match
    const typeMatch = match.match(/\/check\/(claim|public)\//i)
    const routeType = typeMatch?.[1]?.toLowerCase() ?? 'claim'
    return `/check/${routeType}/${REDACTED_PLACEHOLDER}`
  })
}

/**
 * Sanitize a full URL by redacting sensitive check codes from the path
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.pathname = sanitizePath(parsed.pathname)
    return parsed.toString()
  } catch {
    // If URL parsing fails, fall back to simple pattern replacement
    return sanitizePath(url)
  }
}
