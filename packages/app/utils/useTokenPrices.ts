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

const fetchCoingeckoPrices = async () => {
  const coingeckoIds = allCoins.map((coin) => coin.coingeckoTokenId).toString()

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`,
    {
      headers: {
        Accept: 'application/json',
      },
      mode: 'cors',
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch Coingecko prices. Status: ${res.status}`)
  }

  const json = await res.json()
  const prices = CoingeckoTokenPricesSchema.parse(json)
  return normalizeCoingeckoPrices(prices)
}

const normalizeCoingeckoPrices = (prices: z.infer<typeof CoingeckoTokenPricesSchema>) => {
  return allCoins.reduce(
    (acc, coin) => {
      acc[coin.token] = prices[coin.coingeckoTokenId].usd
      return acc
    },
    {} as Record<string, number>
  )
}

const fetchDexScreenerPrices = async () => {
  const res = await fetch(
    'https://api.dexscreener.com/tokens/v1/base/0x4200000000000000000000000000000000000006,0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,0xEab49138BA2Ea6dd776220fE26b7b8E446638956,0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C' // WETH,USDC,SEND,SPX. hardcoded to avoid testnet tokens
  )
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

const fetchWithFallback = async () => {
  try {
    return await fetchCoingeckoPrices()
  } catch (error) {
    console.warn('Coingecko request failed, falling back to DexScreener')
    return await fetchDexScreenerPrices()
  }
}

type priceSource = 'coingecko' | 'dexscreener'
//takes a price source as an argument
//if no argument is passed, it uses a fallback approach
export const useTokenPrices = (
  source?: priceSource
): UseQueryResult<Record<allCoins[number]['token'], number>, Error> => {
  return useQuery({
    queryKey: ['tokenPrices', source],
    staleTime: 1000 * 60,
    queryFn: async () => {
      switch (source) {
        case 'coingecko':
          return await fetchCoingeckoPrices()
        case 'dexscreener':
          return await fetchDexScreenerPrices()
        default:
          return await fetchWithFallback()
      }
    },
  })
}
