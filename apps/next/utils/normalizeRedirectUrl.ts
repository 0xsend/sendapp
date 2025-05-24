/**
 * Normalizes URLs for authentication redirects
 * Converts Next.js data URLs (/_next/data/[buildId]/path.json) to regular paths (/path)
 * Preserves query parameters while normalizing the path
 */
export function normalizeRedirectUrl(url: string | undefined): string | undefined {
  if (!url) return url

  // Parse URL to separate path and query parameters
  const urlObj = new URL(url, 'http://localhost') // base URL needed for relative URLs
  const pathname = urlObj.pathname
  const search = urlObj.search

  let normalizedPath = pathname

  // Handle Next.js data URLs: /_next/data/[buildId]/path.json -> /path
  if (pathname.startsWith('/_next/data/')) {
    // Extract the path from the data URL
    // Pattern: /_next/data/[buildId]/...path.json
    const match = pathname.match(/^\/_next\/data\/[^/]+\/(.*)\.json$/)
    if (match) {
      const path = match[1]
      // Convert index to root path
      normalizedPath = path === 'index' ? '/' : `/${path}`
    }
  } else if (pathname.endsWith('.json')) {
    // Handle regular .json URLs
    normalizedPath = pathname.replace(/\.json$/, '')
  }

  // Combine normalized path with query parameters
  return normalizedPath + search
}
