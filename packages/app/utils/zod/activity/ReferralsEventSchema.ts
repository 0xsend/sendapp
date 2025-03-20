import { z } from 'zod'
import { BaseEventSchema } from './BaseEventSchema'
import { DatabaseEvents } from './events'

/**
 * Tag receipt event data
 */
export const ReferralsDataSchema = z.object({
  /**
   * The sendtags that were referred, null if it is a non-sendtag referral such as Send Earn
   */
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .transform((val) => val ?? null),
})

export const ReferralsEventSchema = BaseEventSchema.extend({
  event_name: z.literal(DatabaseEvents.Referrals),
  data: ReferralsDataSchema,
})

export type ReferralsEvent = z.infer<typeof ReferralsEventSchema>

export const isReferralsEvent = (event: {
  event_name: string
}): event is ReferralsEvent => event.event_name === DatabaseEvents.Referrals
