import { z } from 'zod'

export const LiquidityPoolSchema = z.object({
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
  pool_addr: z
    .string()
    .transform((v) => Buffer.from(v.slice(2), 'hex').toString())
    .refine((v): v is `0x${string}` => true),
  pool_name: z.string(),
  pool_type: z.string(),
})

export type LiquidityPool = z.infer<typeof LiquidityPoolSchema>

export const LiquidityPoolArraySchema = z.array(LiquidityPoolSchema)
