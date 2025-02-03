import { useQuery, queryOptions } from '@tanstack/react-query'

const KYBER_SWAP_BASE_URL = 'https://aggregator-api.kyberswap.com'

interface SwapRouteParams {
  tokenIn?: string
  tokenOut?: string
  amountIn: string
  chain?: string
  to?: string
  clientId?: string
}

interface SwapRouteResponse {
  inputAmount: string
  outputAmount: string
  totalGas: number
  gasPriceGwei: string
  gasUsd: number
  amountInUsd: number
  amountOutUsd: number
  receivedUsd: number
  swaps: Swap[][]
  tokens: Record<string, TokenDetails>
  encodedSwapData: string
  routerAddress: string
}

interface Swap {
  pool: string
  tokenIn: string
  tokenOut: string
  limitReturnAmount: string
  swapAmount: string
  amountOut: string
  exchange: string
  poolLength: number
  poolType: string
  poolExtra?: {
    fee?: number
    feePrecision?: number
    blockNumber?: number
    priceLimit?: number
  }
  extra?: Record<string, unknown> | null
  maxPrice?: string
}

interface TokenDetails {
  address: string
  symbol: string
  name: string
  price: number
  decimals: number
}

const fetchSwapRoute = async ({
  chain = 'base',
  tokenIn,
  tokenOut,
  amountIn,
  to = '0x6cA571D9F6cF441Eb59810977CBfe95F1aA6a63B',
  clientId = 'SendApp',
}: SwapRouteParams): Promise<SwapRouteResponse> => {
  if (!tokenIn || !tokenOut) {
    throw new Error('tokenIn and tokenOut are required')
  }

  const url = new URL(`${KYBER_SWAP_BASE_URL}/${chain}/route/encode`)
  url.searchParams.append('tokenIn', tokenIn)
  url.searchParams.append('tokenOut', tokenOut)
  url.searchParams.append('amountIn', amountIn)
  url.searchParams.append('to', to)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-client-id': clientId,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch swap route: ${response.statusText}`)
  }

  return response.json()
}

const useSwapRouteQueryKey = 'swap_route'

export function useSwapToken({ tokenIn, tokenOut, amountIn }: SwapRouteParams) {
  return useQuery(
    queryOptions({
      queryKey: [useSwapRouteQueryKey, tokenIn, tokenOut, amountIn],
      enabled: Boolean(tokenIn && tokenOut && amountIn),
      queryFn: () =>
        fetchSwapRoute({
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          amountIn,
        }),
    })
  )
}

useSwapToken.queryKey = useSwapRouteQueryKey
