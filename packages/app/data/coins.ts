import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
  spx6900Address as spx6900Addresses,
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

export const usdcCoin = {
  label: 'USDC',
  symbol: 'USDC',
  token: usdcAddresses[baseMainnet.id],
  decimals: 6,
  coingeckoTokenId: 'usd-coin',
} as const

export const ethCoin = {
  label: 'Ethereum',
  symbol: 'ETH',
  token: 'eth',
  decimals: 18,
  coingeckoTokenId: 'ethereum',
} as const

export const sendCoin = {
  label: 'Send',
  symbol: 'SEND',
  token: sendAddresses[baseMainnet.id],
  decimals: 0,
  coingeckoTokenId: 'send-token',
} as const

export const spx6900Coin = {
  label: 'SPX',
  symbol: 'SPX',
  token: spx6900Addresses[baseMainnet.id],
  decimals: 8,
  coingeckoTokenId: 'spx6900',
} as const

/**
 * The coins (tokens) array that are supported by Send App.
 */
export const coins = [usdcCoin, ethCoin, spx6900Coin, sendCoin] as const
export type coins = typeof coins

type CoinsDict = { [key in coins[number]['token']]: coins[number] }

/**
 * A dictionary of coins (tokens) by token address.
 */
export const coinsDict = coins.reduce((acc, coin) => {
  acc[coin.token] = coin
  return acc
}, {} as CoinsDict)

export type coinsDict = typeof coinsDict
