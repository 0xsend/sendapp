import { z } from 'zod'
import type { Hex } from 'viem'

export const KyberRouteSummarySchema = z.object({
  tokenIn: z.string(),
  amountIn: z.string(),
  amountInUsd: z.string(),
  tokenInMarketPriceAvailable: z.boolean(),
  tokenOut: z.string(),
  amountOut: z.string(),
  amountOutUsd: z.string(),
  tokenOutMarketPriceAvailable: z.boolean(),
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
  route: z.array(
    z.array(
      z.object({
        pool: z.string().optional(),
        tokenIn: z.string().optional(),
        tokenOut: z.string().optional(),
        limitReturnAmount: z.string().optional(),
        swapAmount: z.string().optional(),
        amountOut: z.string().optional(),
        exchange: z.string().optional(),
        poolLength: z.number().optional(),
        poolType: z.string().optional(),
        poolExtra: z.nullable(
          z.object({
            fee: z.number().optional(),
            feePrecision: z.number().optional(),
            blockNumber: z.number().optional(),
          })
        ),
        extra: z.nullable(z.unknown()),
      })
    )
  ),
  checksum: z.string(),
  timestamp: z.number(),
})
export type KyberRouteSummary = z.infer<typeof KyberRouteSummarySchema>

export const KyberGetSwapRouteRequestSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
})

export type KyberGetSwapRouteRequest = z.infer<typeof KyberGetSwapRouteRequestSchema>

export type KyberGetSwapRouteResponse = {
  code: number
  message: string
  data: {
    routerAddress: string
    routeSummary: KyberRouteSummary
  }
}

export const KyberEncodeRouteRequestSchema = z.object({
  sender: z.string(),
  recipient: z.string(),
  slippageTolerance: z.number().min(0).max(2000),
  routeSummary: KyberRouteSummarySchema,
})

export type KyberEncodeRouteRequest = {
  sender: string
  recipient: string
  slippageTolerance: number
  routeSummary: KyberRouteSummary
}

export type KyberEncodeRouteResponse = {
  code: number
  message: string
  data: {
    amountIn: string
    amountInUsd: string
    amountOut: string
    amountOutUsd: string
    gas: string
    gasUsd: string
    data: Hex
    routerAddress: Hex
    outputChange: {
      amount: string
      percent: number
      level: number
    }
  }
}
