import type { DefaultSeoProps } from 'next-seo'

export const defaultSEOConfig: DefaultSeoProps = {
  title: 'Send',
  description: 'Peer-to-peer money. Send. Save. Invest.',
  canonical: 'https://send.app',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://send.app',
    title: 'Send',
    description: 'Peer-to-peer money. Send. Save. Invest.',
    siteName: 'Send',
    images: [
      {
        url: 'https://ghassets.send.app/2024/04/send-og-image.png',
        width: 1200,
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
