import {
  aerodromeFinanceAddress,
  baseMainnet,
  coinbaseWrappedBtcAddress,
  eurcAddress,
  moonwellAddress,
  morphoAddress,
  sendTokenAddress,
  spx6900Address,
  usdcAddress,
} from '@my/wagmi'
import { z } from 'zod'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { allCoins } from 'app/data/coins'
import { useUser } from 'app/utils/useUser'
import { useTokensMarketData, type MarketData } from 'app/utils/coin-gecko'

const CoingeckoTokenPriceSchema = z.object({
  usd: z.number(),
})

export const CoingeckoTokenPricesSchema = z.object({
  ethereum: CoingeckoTokenPriceSchema,
  'send-token-2': CoingeckoTokenPriceSchema,
  'usd-coin': CoingeckoTokenPriceSchema,
  spx6900: CoingeckoTokenPriceSchema,
  'moonwell-artemis': CoingeckoTokenPriceSchema,
  morpho: CoingeckoTokenPriceSchema,
  'aerodrome-finance': CoingeckoTokenPriceSchema,
  'coinbase-wrapped-btc': CoingeckoTokenPriceSchema,
  'euro-coin': CoingeckoTokenPriceSchema,
})

const DexScreenerTokenPriceSchema = z.object({
  priceUsd: z.string().nullable(),
  baseToken: z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
  }),
})

export const DexScreenerTokenPricesSchema = z.array(DexScreenerTokenPriceSchema)

const normalizeCoingeckoPrices = (marketData: MarketData) => {
  // Normalize CoinGecko market data current_price into our token-keyed record
  const byId = new Map(marketData.map((d) => [d.id, d.current_price ?? 0]))
  return allCoins.reduce(
    (acc, coin) => {
      acc[coin.token] = byId.get(coin.coingeckoTokenId) ?? 0
      return acc
    },
    {} as Record<string, number>
  )
}

export const fetchDexScreenerPrices = async () => {
  // hardcoded to avoid testnet tokens
  const tokensToFetch = [
    '0x4200000000000000000000000000000000000006', // WETH
    usdcAddress['8453'],
    sendTokenAddress['8453'],
    spx6900Address['8453'],
    moonwellAddress['8453'],
    morphoAddress['8453'],
    aerodromeFinanceAddress['8453'],
    coinbaseWrappedBtcAddress['8453'],
    eurcAddress['8453'],
  ]

  const res = await fetch(`https://api.dexscreener.com/tokens/v1/base/${tokensToFetch.join(',')}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch DexScreener prices. Status: ${res.status}`)
  }

  const json = await res.json()
  const prices = DexScreenerTokenPricesSchema.parse(json)
  return normalizeDexScreenerPrices(prices)
}

const normalizeDexScreenerPrices = (prices: z.infer<typeof DexScreenerTokenPricesSchema>) => {
  return prices.reduce(
    (acc, price) => {
      switch (price.baseToken.symbol) {
        case 'WETH':
          acc.eth = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'USDC':
          acc[usdcAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'SEND':
          acc[sendTokenAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'SPX':
          acc[spx6900Address[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'WELL':
          acc[moonwellAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'MORPHO':
          acc[morphoAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'AERO':
          acc[aerodromeFinanceAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'CBBTC':
          acc[coinbaseWrappedBtcAddress[baseMainnet.id]] = price.priceUsd
            ? Number(price.priceUsd)
            : 0
          break
        case 'EURC':
          acc[eurcAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        default:
          break
      }
      return acc
    },
    {} as Record<string, number>
  )
}

type priceSource = 'coingecko' | 'dexscreener'
//takes a price source as an argument
//if no argument is passed, it uses a fallback approach
export const useTokenPrices = (
  source?: priceSource
): UseQueryResult<Record<allCoins[number]['token'], number>, Error> => {
  const { session } = useUser()
  const isLoggedIn = !!session

  // Always define both  queries, but gate with enabled to satisfy hooks rules

  const cgQuery = useTokensMarketData<Record<(typeof allCoins)[number]['token'], number>>({
    enabled: isLoggedIn && source === 'coingecko',
    select: normalizeCoingeckoPrices,
  })

  const dexQuery = useQuery<Record<(typeof allCoins)[number]['token'], number>, Error>({
    queryKey: ['tokenPrices', 'dexscreener'],
    enabled: isLoggedIn && source === 'dexscreener',
    staleTime: 1000 * 60,
    queryFn: fetchDexScreenerPrices,
  })

  return (source === 'dexscreener' ? dexQuery : cgQuery) as UseQueryResult<
    Record<(typeof allCoins)[number]['token'], number>,
    Error
  >
}
