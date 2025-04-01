import { address, hex } from 'app/utils/zod'
import { z } from 'zod'

// for some reason, kyber requires addresses to be lowercase
const addressLower = address.transform((v): `0x${string}` => v.toLowerCase() as `0x${string}`)

export const KyberGetSwapRouteRequestSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
})

export type KyberGetSwapRouteRequest = z.infer<typeof KyberGetSwapRouteRequestSchema>

const SwapRoutePoolSchema = z.object({
  pool: z.string(), //kyber can return various formats here, contracts addresses (or custom values) instead of LP address (e.g. uniswap v4 hooks)
  tokenIn: addressLower,
  tokenOut: addressLower,
  limitReturnAmount: z.string(),
  swapAmount: z.string(),
  amountOut: z.string(),
  exchange: z.string(),
  poolLength: z.number(),
  poolType: z.string(),
  poolExtra: z.any().optional(),
  extra: z.any().optional(),
})

export const KyberRouteSummarySchema = z.object({
  tokenIn: addressLower,
  amountIn: z.string(),
  amountInUsd: z.string(),
  tokenOut: addressLower,
  amountOut: z.string(),
  amountOutUsd: z.string(),
  gas: z.string(),
  gasPrice: z.string(),
  gasUsd: z.string(),
  extraFee: z
    .object({
      feeAmount: z.string(),
      chargeFeeBy: z.string(),
      isInBps: z.boolean(),
      feeReceiver: z.string(),
    })
    .optional(),
  route: z.array(z.array(SwapRoutePoolSchema)),
  checksum: z.string(),
  timestamp: z.number(),
})

export type KyberRouteSummary = z.infer<typeof KyberRouteSummarySchema>

export const KyberGetSwapRouteResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    routerAddress: addressLower,
    routeSummary: KyberRouteSummarySchema,
  }),
})

export const KyberEncodeRouteRequestSchema = z.object({
  sender: addressLower,
  recipient: addressLower,
  slippageTolerance: z.number().min(0).max(2000),
  routeSummary: KyberRouteSummarySchema,
})

export type KyberEncodeRouteRequest = z.infer<typeof KyberEncodeRouteRequestSchema>

export const KyberEncodeRouteResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    amountIn: z.string(),
    amountInUsd: z.string(),
    amountOut: z.string(),
    amountOutUsd: z.string(),
    gas: z.string(),
    gasUsd: z.string(),
    data: hex,
    routerAddress: addressLower,
  }),
})
