import { z } from 'zod'

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
  router_addr: z
    .string()
    .transform((v) => Buffer.from(v.slice(2), 'hex').toString())
    .refine((v): v is `0x${string}` => true),
})

export type SwapRouter = z.infer<typeof SwapRouterSchema>

export const SwapRouterArraySchema = z.array(SwapRouterSchema)
