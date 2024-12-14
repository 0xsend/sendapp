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
export const coins = [usdcCoin, ethCoin, sendCoin] as const
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

/**
 * The coins (tokens) that sendapp supports through partnerships. (Hidden when balance is 0)
 */
export const partnerCoins = [spx6900Coin] as const
export type partnerCoins = typeof partnerCoins

type PartnerCoinsDict = { [key in partnerCoins[number]['token']]: partnerCoins[number] }

export const partnerCoinsDict = partnerCoins.reduce((acc, coin) => {
  acc[coin.token] = coin
  return acc
}, {} as PartnerCoinsDict)

export type partnerCoinsDict = typeof partnerCoinsDict

export type CoinWithBalance = coin & {
  balance: bigint | undefined
}

/**
 * All coins (tokens) array that are supported by Send App.
 */
export const allCoins = [...coins, ...partnerCoins] as const
export type allCoins = typeof allCoins

type AllCoinsDict = { [key in allCoins[number]['token']]: allCoins[number] }

/**
 * A dictionary of coins (tokens) by token address.
 */
export const allCoinsDict = allCoins.reduce((acc, coin) => {
  acc[coin.token] = coin
  return acc
}, {} as AllCoinsDict)

export type allCoinsDict = typeof allCoinsDict
