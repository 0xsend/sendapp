import { useQuery, queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useSendAccount } from '../send-accounts'

const KYBER_SWAP_BASE_URL = 'https://aggregator-api.kyberswap.com'

interface SwapRouteParams {
  tokenIn?: string
  tokenOut?: string
  amountIn: string
  chain?: string
  to?: string
  clientId?: string
}

const TokenDetailsSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  decimals: z.number(),
})

const SwapSchema = z.object({
  pool: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  limitReturnAmount: z.string(),
  swapAmount: z.string(),
  amountOut: z.string(),
  exchange: z.string(),
  poolLength: z.number(),
  poolType: z.string(),
  poolExtra: z
    .object({
      fee: z.number().optional(),
      feePrecision: z.number().optional(),
      blockNumber: z.number().optional(),
      priceLimit: z.number().optional(),
    })
    .optional(),
  extra: z.record(z.unknown()).nullable().optional(),
  maxPrice: z.string().optional(),
})

const SwapRouteResponseSchema = z.object({
  inputAmount: z.string(),
  outputAmount: z.string(),
  totalGas: z.number(),
  gasPriceGwei: z.string(),
  gasUsd: z.number(),
  amountInUsd: z.number(),
  amountOutUsd: z.number(),
  receivedUsd: z.number(),
  swaps: z.array(z.array(SwapSchema)),
  tokens: z.record(TokenDetailsSchema),
  encodedSwapData: z.string(),
  routerAddress: z.string(),
})

export type SwapRouteResponse = z.infer<typeof SwapRouteResponseSchema>

const fetchSwapRoute = async ({
  chain = 'base',
  tokenIn,
  tokenOut,
  amountIn,
  to,
  clientId = 'SendApp',
}: SwapRouteParams): Promise<SwapRouteResponse> => {
  if (!tokenIn || !tokenOut || !to) {
    throw new Error('tokenIn, tokenOut, and to are required')
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

  const jsonResponse = await response.json()
  const parsedResponse = SwapRouteResponseSchema.parse(jsonResponse)
  return parsedResponse
}

const useSwapRouteQueryKey = 'swap_route'

export function useSwapToken({ tokenIn, tokenOut, amountIn }: SwapRouteParams) {
  const { data: sendAccount } = useSendAccount()

  return useQuery(
    queryOptions({
      queryKey: [useSwapRouteQueryKey, tokenIn, tokenOut, amountIn, sendAccount?.address],
      enabled: Boolean(tokenIn && tokenOut && amountIn && sendAccount?.address),
      queryFn: () =>
        fetchSwapRoute({
          tokenIn,
          tokenOut,
          amountIn,
          to: sendAccount?.address,
        }),
    })
  )
}

useSwapToken.queryKey = useSwapRouteQueryKey
