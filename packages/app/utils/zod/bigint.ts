import { z } from 'zod'

/**
 * Zod schema for parsing and validating bigints from numerical strings.
 */
export const decimalStrToBigInt = z.union([z.string(), z.number()]).transform((v, ctx) => {
  try {
    return BigInt(v)
  } catch (e) {
    ctx.addIssue({
      code: 'invalid_type',
      expected: 'bigint',
      received: typeof v,
      message: `${v} is not a valid bigint`,
    })
  }
})
