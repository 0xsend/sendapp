import { IconEthereum, IconSend, IconUSDC } from 'app/components/icons'
import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'
import { z } from 'zod'

export const CoinSchema = z.object({
  label: z.string(),
  symbol: z.string(),
  icon: z.custom<JSX.Element>(),
  token: z.custom<`0x${string}` | 'eth'>(),
  decimals: z.number().min(0).max(18),
  coingeckoTokenId: z.string(),
})
export type coin = z.infer<typeof CoinSchema>
export type coins = coin[]

export const coins: coins = [
  {
    label: 'USDC',
    symbol: 'USDC',
    token: usdcAddresses[baseMainnet.id],
    decimals: 6,
    // @ts-expect-error react components aren't serializeable using `structuredClone` in tests
    icon: process.env.NODE_ENV === 'test' ? 'USDC' : <IconUSDC size={'$2.5'} />,
    coingeckoTokenId: 'usd-coin',
  },
  {
    label: 'Ethereum',
    symbol: 'ETH',
    token: 'eth',
    decimals: 18,
    // @ts-expect-error react components aren't serializeable using `structuredClone` in tests
    icon: process.env.NODE_ENV === 'test' ? 'ETH' : <IconEthereum size={'$2.5'} />,
    coingeckoTokenId: 'ethereum',
  },
  {
    label: 'Send',
    symbol: 'SEND',
    token: sendAddresses[baseMainnet.id],
    decimals: 0,
    // @ts-expect-error react components aren't serializeable using `structuredClone` in tests
    icon: process.env.NODE_ENV === 'test' ? 'SEND' : <IconSend size={'$2.5'} />,
    coingeckoTokenId: 'send-token',
  },
] as const
