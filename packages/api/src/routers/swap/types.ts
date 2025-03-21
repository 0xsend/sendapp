import { z } from 'zod'

export const KyberGetSwapRouteRequestSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
})

export type KyberGetSwapRouteRequest = z.infer<typeof KyberGetSwapRouteRequestSchema>

const HexSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/i)
  .refine((v): v is `0x${string}` => true)

const EthAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/i)
  .refine((v): v is `0x${string}` => true)

export const KyberRouteSummarySchema = z.object({
  tokenIn: EthAddressSchema,
  amountIn: z.string(),
  amountInUsd: z.string(),
  tokenOut: EthAddressSchema,
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
  route: z.array(
    z.array(
      z.object({
        pool: EthAddressSchema,
        tokenIn: EthAddressSchema,
        tokenOut: EthAddressSchema,
        limitReturnAmount: z.string(),
        swapAmount: z.string(),
        amountOut: z.string(),
        exchange: z.string(),
        poolLength: z.number(),
        poolType: z.string(),
        poolExtra: z.any().optional(),
        extra: z.any().optional(),
      })
    )
  ),
  checksum: z.string(),
  timestamp: z.number(),
})

export type KyberRouteSummary = z.infer<typeof KyberRouteSummarySchema>

export const KyberGetSwapRouteResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    routerAddress: z.string(),
    routeSummary: KyberRouteSummarySchema,
  }),
})

export const KyberEncodeRouteRequestSchema = z.object({
  sender: EthAddressSchema,
  recipient: EthAddressSchema,
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
    data: HexSchema,
    routerAddress: EthAddressSchema,
  }),
})
