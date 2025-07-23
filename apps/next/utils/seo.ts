import type { NextSeoProps } from 'next-seo'

// Default SEO constants
const DEFAULT_SEO_IMAGE = 'https://ghassets.send.app/2024/04/send-og-image.png'
const DEFAULT_TWITTER_HANDLE = '@send'
const DEFAULT_TWITTER_SITE = '@send'
const DEFAULT_IMAGE_DIMENSIONS = { width: 1200, height: 630 }

type BuildSeoParams = {
  title?: string
  description?: string
  url: string
  image?: string
  /**
   * OpenGraph type - defaults to 'profile' for backwards compatibility
   */
  type?: 'website' | 'profile' | 'article' | 'music.song' | 'video.movie'
  /**
   * Custom image dimensions - defaults to 1200x630
   */
  imageDimensions?: { width: number; height: number }
  /**
   * Custom Twitter handle - defaults to '@send'
   */
  twitterHandle?: string
  /**
   * Custom alt text for image - defaults to title
   */
  imageAlt?: string
}

/**
 * Builds consistent SEO metadata for Next.js pages using NextSeo
 *
 * @param params - SEO configuration parameters
 * @returns NextSeoProps object ready for use with NextSeo component
 *
 * @example
 * ```tsx
 * const seo = buildSeo({
 *   title: 'User Profile',
 *   description: 'Check out this user profile',
 *   url: 'https://send.app/profile/123',
 *   image: 'https://example.com/profile.png'
 * })
 *
 * return <NextSeo {...seo} />
 * ```
 */
export function buildSeo({
  title,
  description,
  url,
  image,
  type = 'profile',
  imageDimensions = DEFAULT_IMAGE_DIMENSIONS,
  twitterHandle = DEFAULT_TWITTER_HANDLE,
  imageAlt,
}: BuildSeoParams): NextSeoProps {
  const finalImage = image || DEFAULT_SEO_IMAGE
  const finalImageAlt = imageAlt || title || 'Send - Peer-to-peer money'

  return {
    title,
    description,
    canonical: url,
    openGraph: {
      url,
      title,
      description,
      images: [
        {
          url: finalImage,
          width: imageDimensions.width,
          height: imageDimensions.height,
          alt: finalImageAlt,
          type: 'image/png',
        },
      ],
      type,
    },
    twitter: {
      cardType: 'summary_large_image',
      handle: twitterHandle,
      site: DEFAULT_TWITTER_SITE,
    },
  }
}
