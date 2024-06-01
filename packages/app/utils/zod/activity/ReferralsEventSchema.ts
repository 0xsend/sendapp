import { z } from 'zod'
import { BaseEventSchema } from './BaseEventSchema'
import { Events } from './events'

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
  event_name: z.literal(Events.Referrals),
  data: ReferralsDataSchema,
})

export type ReferralsEvent = z.infer<typeof ReferralsEventSchema>

export const isReferralsEvent = (event: {
  event_name: string
}): event is ReferralsEvent => event.event_name === Events.Referrals
