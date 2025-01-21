import { baseMainnet, sendTokenAddress, spx6900Address, usdcAddress } from '@my/wagmi'
import { z } from 'zod'
import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import type { allCoins } from 'app/data/coins'

const CoingeckoTokenPriceSchema = z.object({
  usd: z.number(),
})

export const CoingeckoTokenPricesSchema = z.object({
  ethereum: CoingeckoTokenPriceSchema,
  'send-token': CoingeckoTokenPriceSchema,
  'usd-coin': CoingeckoTokenPriceSchema,
  spx6900: CoingeckoTokenPriceSchema,
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
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,send-token,spx6900&vs_currencies=usd'
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch Coingecko prices. Status: ${res.status}`)
  }

  const json = await res.json()
  const prices = CoingeckoTokenPricesSchema.parse(json)
  return normalizeCoingeckoPrices(prices)
}

const normalizeCoingeckoPrices = (prices: z.infer<typeof CoingeckoTokenPricesSchema>) => {
  return {
    [sendTokenAddress[baseMainnet.id]]: prices['send-token'].usd,
    [spx6900Address[baseMainnet.id]]: prices.spx6900.usd,
    eth: prices.ethereum.usd,
    [usdcAddress[baseMainnet.id]]: prices['usd-coin'].usd,
  }
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
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      console.warn('Coingecko rate limited, falling back to DexScreener')
      return await fetchDexScreenerPrices()
    }
    throw error
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
