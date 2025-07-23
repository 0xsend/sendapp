/**
 * Gets the secure site URL by leveraging Vercel's environment variables and development checks.
 * This ensures protection against host header injection attacks.
 *
 * @see https://vercel.com/docs/deployments/og-preview
 *
 * @businessLogic
 * - Uses Vercel's VERCEL_URL environment variable for production
 * - Utilizes __DEV__ for development environments
 * - Uses NODE_ENV and CI for development checks
 * - Provides a secure fallback for unknown environments
 *
 * @edgeCases
 * - Returns localhost:3000 during development if no dev URL is set
 * - Fallbacks to a production URL if VERCEL_URL is not provided
 *
 */
export function getSiteUrl(): string {
  // For Vercel deployments leveraging the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // For local development, use NEXT_PUBLIC_URL from your .env files
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  }

  // For CI or other development checks
  if (process.env.NODE_ENV === 'development' || process.env.CI) {
    return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  }

  // Secure fallback to production domain
  return 'https://send.app'
}
