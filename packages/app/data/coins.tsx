import { IconEthereum, IconSend, IconUSDC } from 'app/components/icons'
import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'

export const coins = [
  {
    label: 'USDC',
    symbol: 'USDC',
    token: usdcAddresses[baseMainnet.id],
    icon: <IconUSDC size={'$2.5'} />,
    coingeckoTokenId: 'usd-coin',
  },
  {
    label: 'Ethereum',
    symbol: 'ETH',
    token: 'eth',
    icon: <IconEthereum size={'$2.5'} />,
    coingeckoTokenId: 'ethereum',
  },
  {
    label: 'Send',
    symbol: 'SEND',
    token: sendAddresses[baseMainnet.id],
    icon: <IconSend size={'$2.5'} />,
    coingeckoTokenId: 'send-token',
  },
] as const

export type coins = typeof coins
