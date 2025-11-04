import { getRemoteAssets } from 'utils/getRemoteAssets'
import { createHash } from 'node:crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

// Static cache key - these images never change
const CACHE_KEY = 'carousel-images-v1'

/**
 * API route to generate carousel images with plaiceholder blur effect
 * Plaiceholders are generated on-demand and cached by CDN
 * Images may change periodically, so we use a 7-day cache with stale-while-revalidate
 *
 * This endpoint is designed to be cacheable by Cloudflare:
 * - GET only
 * - No auth headers or cookies
 * - Proper cache headers set
 * - ETag for validation
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const paths = [
      'app_images/auth_image_3.jpg',
      'app_images/auth_image_2.jpg',
      'app_images/auth_image_1.jpg',
    ]

    // Generate plaiceholders for all images
    const images = await getRemoteAssets(paths)

    // Generate ETag for cache validation
    const etag = createHash('md5').update(CACHE_KEY).digest('hex')

    // Check if client has cached version
    const ifNoneMatch = req.headers['if-none-match']
    if (ifNoneMatch === `"${etag}"`) {
      res.status(304).end()
      return
    }

    // Cache for 7 days - images may change periodically but not frequently
    // Cloudflare-specific header for CDN caching
    res.setHeader('CDN-Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000')
    // Standard cache control for other CDNs and browsers
    // s-maxage: 7 days for CDN, stale-while-revalidate: 30 days to serve stale while revalidating
    res.setHeader(
      'Cache-Control',
      'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000'
    )
    res.setHeader('ETag', `"${etag}"`)
    // Don't vary cache by headers - ensure all requests get the same cached response
    res.status(200).json({ images })
  } catch (error) {
    console.error('Error generating carousel images:', error)
    res.status(500).json({ error: 'Failed to generate images' })
  }
}
