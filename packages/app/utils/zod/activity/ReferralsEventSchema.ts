import { z } from 'zod'
import { BaseEventSchema } from './BaseEventSchema'

/**
 * Tag receipt event data
 */
export const ReferralsDataSchema = z.object({
  /**
   * The sendtags that were referred
   */
  tags: z.array(z.string()),
})

export const ReferralsEventSchema = BaseEventSchema.extend({
  event_name: z.literal('referrals'),
  data: ReferralsDataSchema,
})

export type ReferralsEvent = z.infer<typeof ReferralsEventSchema>

export const isReferralsEvent = (event: {
  event_name: string
}): event is ReferralsEvent => event.event_name === 'referrals'
