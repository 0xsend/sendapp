import { getRemoteAssets } from 'utils/getRemoteAssets'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * API route to generate carousel images with plaiceholder blur effect
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

    const images = await getRemoteAssets(paths)

    // Cache for 24 hour since images don't change often
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400')
    res.status(200).json({ images })
  } catch (error) {
    console.error('Error generating carousel images:', error)
    res.status(500).json({ error: 'Failed to generate images' })
  }
}
