import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
  spx6900Address as spx6900Addresses,
  sendTokenV0Address,
  moonwellAddress as moonwellAddresses,
  morphoAddress as morphoAddresses,
  aerodromeFinanceAddress as aerodromeFinanceAddresses,
  coinbaseWrappedBtcAddress as coinbaseWrappedBtcAddresses,
  eurcAddress as eurcAddresses,
} from '@my/wagmi'
import { z } from 'zod'

const BaseCoinSchema = z.object({
  label: z.string(),
  symbol: z.string(),
  decimals: z.number().min(0).max(18),
  formatDecimals: z.number().min(0).optional(),
  coingeckoTokenId: z.string(),
})

// ERC20 specific schema
export const ERC20CoinSchema = BaseCoinSchema.extend({
  token: z.custom<`0x${string}`>(),
})

// ETH specific schema
export const ETHCoinSchema = BaseCoinSchema.extend({
  token: z.literal('eth'),
})

export const CoinSchema = z.union([ERC20CoinSchema, ETHCoinSchema])

export type coin = z.infer<typeof CoinSchema>
export type erc20Coin = z.infer<typeof ERC20CoinSchema>
export type ethCoin = z.infer<typeof ETHCoinSchema>

export const usdcCoin = {
  label: 'USDC',
  symbol: 'USDC',
  token: usdcAddresses[baseMainnet.id],
  decimals: 6,
  formatDecimals: 2,
  coingeckoTokenId: 'usd-coin',
} as const satisfies coin

export const ethCoin = {
  label: 'Ethereum',
  symbol: 'ETH',
  token: 'eth',
  decimals: 18,
  coingeckoTokenId: 'ethereum',
  formatDecimals: 5,
} as const satisfies coin

export const sendCoin = {
  label: 'Send',
  symbol: 'SEND',
  token: sendAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 0,
  coingeckoTokenId: 'send-token-2',
} as const satisfies coin

// can probably remove this
export const sendV0Coin = {
  label: 'Send',
  symbol: 'SEND',
  token: sendTokenV0Address[baseMainnet.id],
  decimals: 0,
  coingeckoTokenId: 'send-token',
  formatDecimals: 0,
} as const satisfies coin

export const spx6900Coin = {
  label: 'SPX',
  symbol: 'SPX',
  token: spx6900Addresses[baseMainnet.id],
  decimals: 8,
  formatDecimals: 2,
  coingeckoTokenId: 'spx6900',
} as const satisfies coin

export const moonwellCoin = {
  label: 'Moonwell',
  symbol: 'WELL',
  token: moonwellAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 0,
  coingeckoTokenId: 'moonwell-artemis',
} as const satisfies coin

export const morphoCoin = {
  label: 'Morpho',
  symbol: 'MORPHO',
  token: morphoAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 2,
  coingeckoTokenId: 'morpho',
} as const satisfies coin

export const aerodromeCoin = {
  label: 'Aerodrome Finance',
  symbol: 'AERO',
  token: aerodromeFinanceAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 2,
  coingeckoTokenId: 'aerodrome-finance',
} as const satisfies coin

export const cbBtcCoin = {
  label: 'Coinbase Wrapped BTC',
  symbol: 'CBBTC',
  token: coinbaseWrappedBtcAddresses[baseMainnet.id],
  decimals: 8,
  formatDecimals: 6,
  coingeckoTokenId: 'coinbase-wrapped-btc',
} as const satisfies coin

export const eurcCoin = {
  label: 'EURC',
  symbol: 'EURC',
  token: eurcAddresses[baseMainnet.id],
  decimals: 6,
  formatDecimals: 2,
  coingeckoTokenId: 'euro-coin',
} as const satisfies coin

/**
 * The coins (tokens) array that are supported by Send App.
 */
export const coins: coin[] = [usdcCoin, sendCoin] as const
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
export const partnerCoins: coin[] = [
  ethCoin,
  cbBtcCoin,
  spx6900Coin,
  moonwellCoin,
  aerodromeCoin,
  morphoCoin,
  eurcCoin,
] as const
export type partnerCoins = typeof partnerCoins

type PartnerCoinsDict = { [key in partnerCoins[number]['token']]: partnerCoins[number] }

export const partnerCoinsDict = partnerCoins.reduce((acc, coin) => {
  acc[coin.token] = coin
  return acc
}, {} as PartnerCoinsDict)

export type partnerCoinsDict = typeof partnerCoinsDict

/**
 * All coins (tokens) array that are supported by Send App.
 */
export const allCoins: coin[] = [...coins, ...partnerCoins] as const
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

export type CoinWithBalance = allCoins[number] & {
  balance: bigint | undefined
}

/**
 * Known coins are a list of coins that Send app knows about but not necessarily supports.
 */
export const knownCoins: coin[] = [...allCoins, sendV0Coin] as const

export const isEthCoin = (coin: coin): coin is ethCoin => coin.symbol === 'ETH'
