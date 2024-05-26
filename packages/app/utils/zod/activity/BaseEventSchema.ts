import { z } from 'zod'
import { UserSchema } from './UserSchema'

export const BaseEventSchema = z.object({
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
  event_name: z.string(),
  from_user: UserSchema.nullable(),
  to_user: UserSchema.nullable(),
  data: z.object({}).nullable(),
})
