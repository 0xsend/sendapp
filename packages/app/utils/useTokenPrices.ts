import {
  aerodromeFinanceAddress,
  baseMainnet,
  coinbaseWrappedBtcAddress,
  eurcAddress,
  mamoAddress,
  masqAddress,
  lateNightOnBaseAddress,
  moonwellAddress,
  morphoAddress,
  sendTokenAddress,
  spx6900Address,
  usdcAddress,
} from '@my/wagmi'
import { z } from 'zod'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { allCoins } from 'app/data/coins'
import { usePathname } from 'app/utils/usePathname'
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
  mamo: CoingeckoTokenPriceSchema,
  masq: CoingeckoTokenPriceSchema,
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
      // Canton has id='canton' in marketData (from TheTie/Hyperliquid via useTokensMarketData)
      if (coin.token === 'CC') {
        acc[coin.token] = byId.get('canton') ?? 0
        return acc
      }
      // Skip coins without CoinGecko ID - they'll get prices from DexScreener
      acc[coin.token] = coin.coingeckoTokenId ? (byId.get(coin.coingeckoTokenId) ?? 0) : 0
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
    mamoAddress['8453'],
    masqAddress['8453'],
    lateNightOnBaseAddress['8453'],
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
        case 'MAMO':
          acc[mamoAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'MASQ':
          acc[masqAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
          break
        case 'latenightonbase':
          acc[lateNightOnBaseAddress[baseMainnet.id]] = price.priceUsd ? Number(price.priceUsd) : 0
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

// Takes a price source as an argument
// If no argument is passed, it uses a fallback approach
export const useTokenPrices = (
  source: priceSource = 'coingecko'
): {
  query: UseQueryResult<Record<allCoins[number]['token'], number>, Error>
  enabled: boolean
} => {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  const cgQueryEnabled = !isAuthRoute && source === 'coingecko'
  const cgQuery = useTokensMarketData<Record<(typeof allCoins)[number]['token'], number>>({
    enabled: cgQueryEnabled,
    select: normalizeCoingeckoPrices,
  })

  // Check if CoinGecko has missing prices (returns 0 for tokens not in their database)
  const hasMissingPrices =
    cgQuery.isSuccess &&
    cgQuery.data &&
    Object.values(cgQuery.data).some((price) => price === 0 || price === null)

  const dexQueryEnabled =
    !isAuthRoute &&
    (source === 'dexscreener' || (source === 'coingecko' && (cgQuery.isError || hasMissingPrices)))

  const dexQuery = useQuery<Record<(typeof allCoins)[number]['token'], number>, Error>({
    queryKey: ['tokenPrices', 'dexscreener'],
    enabled: dexQueryEnabled,
    staleTime: 1000 * 60,
    queryFn: fetchDexScreenerPrices,
  })

  // Fallback: if CoinGecko errors or has missing prices, use DexScreener
  // If both sources have data, merge them with DexScreener taking precedence for tokens with 0 price from CoinGecko
  const useDex = source === 'dexscreener' || (source === 'coingecko' && cgQuery.isError)

  if (source === 'coingecko' && cgQuery.isSuccess && dexQuery.isSuccess && hasMissingPrices) {
    // Merge: use DexScreener prices for tokens where CoinGecko returned 0
    const mergedData = { ...cgQuery.data }
    for (const [token, price] of Object.entries(cgQuery.data)) {
      if (price === 0 || price === null) {
        mergedData[token] = dexQuery.data[token] ?? 0
      }
    }
    return {
      query: {
        ...cgQuery,
        data: mergedData,
      },
      enabled: cgQueryEnabled && dexQueryEnabled,
    }
  }

  return {
    query: useDex ? dexQuery : cgQuery,
    enabled: useDex ? dexQueryEnabled : cgQueryEnabled,
  }
}
