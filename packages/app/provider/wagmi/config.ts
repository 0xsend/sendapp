import { chains } from '@my/wagmi'

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

const metadata = {
  name: '/send',
  description: 'Send App',
  url: 'https://send.app',
  icons: [
    'https://raw.githubusercontent.com/0xsend/sendapp/188fffab9b4d9ab6d332baad09ca14da3308f554/apps/next/public/favicon/apple-touch-icon.png',
  ],
}

export const config = defaultWagmiConfig({
  chains,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  metadata,
  enableInjected: true,
  ssr: true,
  auth: {
    email: false,
  },
})
