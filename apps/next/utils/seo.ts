import type { NextSeoProps } from 'next-seo'

type BuildSeoParams = {
  title?: string
  description?: string
  url: string
  image?: string
}

export function buildSeo({ title, description, url, image }: BuildSeoParams): NextSeoProps {
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      url,
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
      type: 'profile',
    },
    twitter: {
      cardType: 'summary_large_image',
      handle: '@send', // override if needed
      site: '@send',
    },
  }
}
