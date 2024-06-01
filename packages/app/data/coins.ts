import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'
import { z } from 'zod'

export const CoinSchema = z.object({
  label: z.string(),
  symbol: z.string(),
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
    coingeckoTokenId: 'usd-coin',
  },
  {
    label: 'Ethereum',
    symbol: 'ETH',
    token: 'eth',
    decimals: 18,
    coingeckoTokenId: 'ethereum',
  },
  {
    label: 'Send',
    symbol: 'SEND',
    token: sendAddresses[baseMainnet.id],
    decimals: 0,
    coingeckoTokenId: 'send-token',
  },
] as const
