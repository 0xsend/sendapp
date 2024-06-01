import { z } from 'zod'
import { BaseEventSchema } from './BaseEventSchema'
import { ReferralsEventSchema } from './ReferralsEventSchema'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'
import { TagReceiptsEventSchema } from './TagReceiptsEventSchema'

export { BaseEvent } from './BaseEventSchema'
export { ReferralsEventSchema, isReferralsEvent } from './ReferralsEventSchema'
export {
  SendAccountTransfersEventSchema,
  isSendAccountTransfersEvent,
} from './SendAccountTransfersEventSchema'
export { TagReceiptsEventSchema, isTagReceiptsEvent } from './TagReceiptsEventSchema'
export { Events } from './events'

export const EventSchema = z
  .discriminatedUnion('event_name', [
    SendAccountTransfersEventSchema,
    TagReceiptsEventSchema,
    ReferralsEventSchema,
  ])
  .or(BaseEventSchema)
  .catch((ctx) => {
    // this is only required since the discrimnated union hard errors when a non-matching event is passed
    // if an unknown event is found, we should return a generic event
    if (ctx.error.name === 'ZodError') {
      const { issues } = ctx.error
      if (issues.some((i) => i.code === 'invalid_union_discriminator')) {
        return BaseEventSchema.parse(ctx.input)
      }
    }
    return BaseEventSchema.parse(ctx.input)
  })

export type Activity = z.infer<typeof EventSchema>

export const EventArraySchema = z.array(EventSchema)