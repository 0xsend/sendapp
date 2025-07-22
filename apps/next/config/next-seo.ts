import type { DefaultSeoProps } from 'next-seo'

export const defaultSEOConfig: DefaultSeoProps = {
  title: 'Send',
  titleTemplate: '%s | Send',
  description: 'Peer-to-peer money. Send. Save. Invest.',
  canonical: 'https://send.app',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://send.app',
    title: 'Send',
    description: 'Peer-to-peer money. Send. Save. Invest.',
    site_name: 'Send',
    images: [
      {
        url: 'https://ghassets.send.app/2024/04/send-og-image.png',
        width: 800,
        height: 630,
        alt: 'Send - Peer-to-peer money',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    cardType: 'summary_large_image',
    site: '@send',
    handle: '@send',
  },
}

type BuildOpenGraphParams = {
  title: string
  description: string
  image: string
  url: string
}

export function buildOpenGraph({ title, description, image, url }: BuildOpenGraphParams) {
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image,
          width: 800,
          height: 630,
          alt: `${title} - Send`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      cardType: 'summary_large_image' as const,
      site: '@send',
    },
  }
}
