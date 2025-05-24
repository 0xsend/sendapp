/**
 * Normalizes URLs for authentication redirects
 * Converts Next.js data URLs (/_next/data/[buildId]/path.json) to regular paths (/path)
 */
export function normalizeRedirectUrl(url: string | undefined): string | undefined {
  if (!url) return url

  // Handle Next.js data URLs: /_next/data/[buildId]/path.json -> /path
  if (url.startsWith('/_next/data/')) {
    // Extract the path from the data URL
    // Pattern: /_next/data/[buildId]/...path.json
    const match = url.match(/^\/_next\/data\/[^/]+\/(.*)\.json$/)
    if (match) {
      return `/${match[1]}`
    }
  } else if (url.endsWith('.json')) {
    // Handle regular .json URLs
    return url.replace(/\.json$/, '')
  }

  return url
}
