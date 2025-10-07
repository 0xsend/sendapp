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
  mamoAddress as mamoAddresses,
} from '@my/wagmi'
import { z } from 'zod'

// Compile-time union of supported CoinGecko IDs for type-safety across app and api
export const COINGECKO_IDS = [
  'usd-coin',
  'ethereum',
  'send-token-2',
  'send-token',
  'spx6900',
  'moonwell-artemis',
  'morpho',
  'aerodrome-finance',
  'coinbase-wrapped-btc',
  'euro-coin',
  'mamo',
] as const satisfies readonly [string, ...string[]]
export type CoingeckoId = (typeof COINGECKO_IDS)[number]

// Base coin schema with common properties
const BaseCoinSchema = z.object({
  label: z.string(),
  symbol: z.string(),
  decimals: z.number().min(0).max(18),
  formatDecimals: z.number().min(0).optional(),
  shortLabel: z.string().optional(),
  coingeckoTokenId: z.enum(COINGECKO_IDS),
  minAmount: z.number().min(0).optional(),
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
  minAmount: 0.01,
} as const satisfies erc20Coin

export const ethCoin = {
  label: 'Ethereum',
  symbol: 'ETH',
  token: 'eth',
  decimals: 18,
  coingeckoTokenId: 'ethereum',
  formatDecimals: 5,
  minAmount: 0.001,
} as const satisfies ethCoin

export const sendCoin = {
  label: 'Send',
  symbol: 'SEND',
  token: sendAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 0,
  coingeckoTokenId: 'send-token-2',
  minAmount: 1,
} as const satisfies erc20Coin

// can probably remove this
export const sendV0Coin = {
  label: 'Send',
  symbol: 'SEND',
  token: sendTokenV0Address[baseMainnet.id],
  decimals: 0,
  coingeckoTokenId: 'send-token',
  formatDecimals: 0,
} as const satisfies erc20Coin

export const spx6900Coin = {
  label: 'SPX',
  symbol: 'SPX',
  token: spx6900Addresses[baseMainnet.id],
  decimals: 8,
  formatDecimals: 2,
  coingeckoTokenId: 'spx6900',
  minAmount: 0.01,
} as const satisfies erc20Coin

export const moonwellCoin = {
  label: 'Moonwell',
  symbol: 'WELL',
  token: moonwellAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 0,
  coingeckoTokenId: 'moonwell-artemis',
  minAmount: 1,
} as const satisfies erc20Coin

export const morphoCoin = {
  label: 'Morpho',
  symbol: 'MORPHO',
  token: morphoAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 2,
  coingeckoTokenId: 'morpho',
  minAmount: 0.01,
} as const satisfies erc20Coin

export const aerodromeCoin = {
  label: 'Aerodrome Finance',
  shortLabel: 'Aerodrome',
  symbol: 'AERO',
  token: aerodromeFinanceAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 2,
  coingeckoTokenId: 'aerodrome-finance',
  minAmount: 0.01,
} as const satisfies erc20Coin

export const cbBtcCoin = {
  label: 'Coinbase Wrapped BTC',
  shortLabel: 'cbBTC',
  symbol: 'CBBTC',
  token: coinbaseWrappedBtcAddresses[baseMainnet.id],
  decimals: 8,
  formatDecimals: 6,
  coingeckoTokenId: 'coinbase-wrapped-btc',
  minAmount: 0.000001,
} as const satisfies erc20Coin

export const eurcCoin = {
  label: 'EURC',
  symbol: 'EURC',
  token: eurcAddresses[baseMainnet.id],
  decimals: 6,
  formatDecimals: 2,
  coingeckoTokenId: 'euro-coin',
  minAmount: 0.01,
} as const satisfies erc20Coin

export const mamoCoin = {
  label: 'Mamo',
  symbol: 'MAMO',
  token: mamoAddresses[baseMainnet.id],
  decimals: 18,
  formatDecimals: 2,
  coingeckoTokenId: 'mamo',
  minAmount: 0.01,
} as const satisfies erc20Coin

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

type CoinsBySymbolDict = { [key in coins[number]['symbol']]: coins[number] }
export const coinsBySymbol = coins.reduce((acc, coin) => {
  acc[coin.symbol] = coin
  return acc
}, {} as CoinsBySymbolDict)

export type coinsBySymbol = typeof coinsBySymbol

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
  mamoCoin,
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

export type CoinWithBalance = coin & {
  balance: bigint | undefined
}

/**
 * Known coins are a list of coins that Send app knows about but not necessarily supports.
 */
export const knownCoins: coin[] = [...allCoins, sendV0Coin] as const

/**
 * List of erc20 coins
 */
export const erc20Coins: erc20Coin[] = [
  usdcCoin,
  sendCoin,
  cbBtcCoin,
  spx6900Coin,
  moonwellCoin,
  aerodromeCoin,
  morphoCoin,
  eurcCoin,
  mamoCoin,
] as const

export const isEthCoin = (coin: coin): coin is ethCoin => coin.symbol === 'ETH'

export const stableCoins = [usdcCoin, eurcCoin] as const

export const investmentCoins = [
  ethCoin,
  sendCoin,
  cbBtcCoin,
  spx6900Coin,
  moonwellCoin,
  aerodromeCoin,
  morphoCoin,
  mamoCoin,
] as const
