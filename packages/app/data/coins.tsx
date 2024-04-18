import { IconEthereum, IconSend, IconUSDC } from 'app/components/icons'
import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'
import { z } from 'zod'

const CoinSchema = z.object({
  label: z.string(),
  symbol: z.string(),
  icon: z.custom<JSX.Element>(),
  token: z.custom<`0x${string}` | 'eth'>(),
  coingeckoTokenId: z.string(),
})
export type coin = z.infer<typeof CoinSchema>
export type coins = coin[]

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
] as coins
