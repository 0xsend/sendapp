import { z } from 'zod'
export const epochToDate = z.union([z.string(), z.number()]).transform((v, ctx) => {
  // ensure the value is a number
  if (typeof v !== 'number') {
    ctx.addIssue({
      code: 'invalid_type',
      expected: 'number',
      received: typeof v,
      message: `${v} is not a valid number`,
    })
    return z.NEVER
  }
  try {
    return new Date(v * 1000)
  } catch (e) {
    ctx.addIssue({
      code: 'invalid_type',
      expected: 'date',
      received: typeof v,
      message: `${v} is not a valid date`,
    })
    return z.NEVER
  }
})
