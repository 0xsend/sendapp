import { z } from 'zod'
import { byteaToHexEthAddress } from './bytea'

export const SwapRouterSchema = z.object({
  created_at: z.string().transform((v, ctx) => {
    try {
      return new Date(v)
    } catch (e) {
      ctx.addIssue({
        code: 'invalid_type',
        expected: 'date',
        received: typeof v,
        message: `${v} is not a valid date`,
      })
      return z.NEVER
    }
  }),
  router_addr: byteaToHexEthAddress,
})

export type SwapRouter = z.infer<typeof SwapRouterSchema>

export const SwapRouterArraySchema = z.array(SwapRouterSchema)
