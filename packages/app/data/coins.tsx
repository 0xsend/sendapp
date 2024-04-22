import { IconEthereum, IconSend, IconUSDC } from 'app/components/icons'
import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'

export const coins = [
  {
    label: 'USDC',
    token: usdcAddresses[baseMainnet.id],
    icon: <IconUSDC size={'$2.5'} />,
    coingeckoTokenId: 'usd-coin',
  },
  {
    label: 'Ethereum',
    token: 'eth',
    icon: <IconEthereum size={'$2.5'} />,
    coingeckoTokenId: 'ethereum',
  },
  {
    label: 'Send',
    token: sendAddresses[baseMainnet.id],
    icon: <IconSend size={'$2.5'} />,
    coingeckoTokenId: 'send-token',
  },
] as const

export type coins = typeof coins
